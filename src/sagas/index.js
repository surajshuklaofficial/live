/**
 * The root saga of the Skybrush application.
 */

import config from 'config';

import { all } from 'redux-saga/effects';

import hotkeySaga from '~/features/hotkeys/saga';
import localServerSaga from '~/features/local-server/saga';
import measurementSaga from '~/features/measurement/saga';
import serversSaga from '~/features/servers/saga';
import showSaga from '~/features/show/saga';
import sessionSaga from '~/features/session/saga';
import tourSaga from '~/features/tour/saga';
import uavManagementSaga from '~/features/uavs/saga';
import flock from '~/flock';

import onboardingSaga from './onboarding';

/**
 * The root saga of the Skybrush application.
 */
export default function* rootSaga() {
  const { localServer } = (window ? window.bridge : null) || {};
  const sagas = [
    hotkeySaga(),
    measurementSaga(),
    onboardingSaga(),
    serversSaga(),
    showSaga(),
    uavManagementSaga(flock),
  ];

  if (localServer && localServer.search) {
    sagas.push(localServerSaga(localServer.search));
  }

  if (config && config.session) {
    sagas.push(sessionSaga(config.session));
  }

  if (config && config.tour) {
    sagas.push(tourSaga());
  }

  yield all(sagas);
}
