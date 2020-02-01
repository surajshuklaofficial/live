import { all, call, delay, put, select, take } from 'redux-saga/effects';

import {
  areServerAuthenticationSettingsValid,
  isAuthenticated,
  isAuthenticating,
  isConnected,
  requiresAuthentication
} from './selectors';
import {
  authenticateToServerPromiseFulfilled,
  setAuthenticatedUser,
  setCurrentServerConnectionState,
  updateCurrentServerAuthenticationSettings
} from './slice';

import { showAuthenticationDialog } from '~/actions/servers';
import { showSnackbarMessage } from '~/features/snackbar/slice';
import messageHub from '~/message-hub';
import { isAuthenticationDialogOpen } from '~/selectors/dialogs';

/**
 * Saga that detects when the authentication-related information of the
 * current server we are connected to becomes invalid, and initiates a query
 * of the supported authentication methods.
 */
function* serverAuthenticationSettingsUpdaterSaga() {
  while (true) {
    const isConnectedToServer = yield select(isConnected);
    const settingsValid = yield select(areServerAuthenticationSettingsValid);

    if (isConnectedToServer && !settingsValid) {
      // Settings were invalidated, force a query
      const result = yield call(async () => {
        try {
          const { body } = await messageHub.sendMessage('AUTH-INF');
          return {
            methods: body.methods || [],
            required: body.required || false
          };
        } catch {
          return undefined;
        }
      });

      const user = yield call(async () => {
        try {
          const { body } = await messageHub.sendMessage('AUTH-WHOAMI');
          return body.user || '';
        } catch {
          return '';
        }
      });

      if (result) {
        result.user = user;
        yield put(updateCurrentServerAuthenticationSettings(result));
      }
    }

    // Wait for the next signal to start a search
    yield take(setCurrentServerConnectionState.type);
  }
}

/**
 * Saga that detects successful or failed authentications and shows an
 * appropriate message in the snackbar.
 */
function* authenticationResultNotifierSaga() {
  while (true) {
    const { payload } = yield take(authenticateToServerPromiseFulfilled.type);
    const { result, reason, user } = payload;

    if (result) {
      yield put(setAuthenticatedUser(user));
      if (user) {
        yield put(
          showSnackbarMessage({
            message: `You are now authenticated as ${user}`,
            semantics: 'success'
          })
        );
      } else {
        yield put(
          showSnackbarMessage({
            message: `You are now deauthenticated`,
            semantics: 'success'
          })
        );
      }
    } else {
      yield put(
        showSnackbarMessage({
          message: reason || 'Authentication failed',
          semantics: 'error'
        })
      );
    }
  }
}

/**
 * Infinite loop that ensures that the authentication dialog is shown if the
 * user is not authenticated yet and is not authenticating at the moment.
 * Returns if the connection breaks.
 */
function* ensureUserIsAuthenticated() {
  while (true) {
    const stillConnected = yield select(isConnected);
    if (!stillConnected) {
      break;
    }

    const shouldShowAuthDialog =
      !(yield select(isAuthenticated)) &&
      !(yield select(isAuthenticating)) &&
      !(yield select(isAuthenticationDialogOpen));

    if (shouldShowAuthDialog) {
      yield put(showAuthenticationDialog());
    }

    yield delay(1000);
  }
}

/**
 * Saga that enforces authentication if the server declares that it is
 * authentication-only.
 */
function* enforceAuthenticationIfNeededSaga() {
  while (true) {
    const isConnectedToServer = yield select(isConnected);
    const settingsValid = yield select(areServerAuthenticationSettingsValid);

    if (isConnectedToServer && settingsValid) {
      // We are connected; does the server need authentication?
      const requiresAuth = yield select(requiresAuthentication);
      if (requiresAuth) {
        // Yes, it does. Show the authentication dialog if we are not
        // authenticated and not authenticating yet.
        yield* ensureUserIsAuthenticated();
      }
    }

    // Wait until the connection state of the server changes or we receive new
    // authentication settings
    yield take([
      setCurrentServerConnectionState.type,
      updateCurrentServerAuthenticationSettings.type
    ]);
  }
}

/**
 * Compound saga related to the management of the connection to the upstream
 * Skybrush server.
 */
export default function* serversSaga() {
  const sagas = [
    serverAuthenticationSettingsUpdaterSaga(),
    enforceAuthenticationIfNeededSaga(),
    authenticationResultNotifierSaga()
  ];
  yield all(sagas);
}