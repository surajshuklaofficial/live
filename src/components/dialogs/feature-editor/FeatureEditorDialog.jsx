import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Tab from '@material-ui/core/Tab';

import { removeFeature } from '~/actions/features';
import {
  closeFeatureEditorDialog,
  setFeatureEditorDialogTab,
} from '~/actions/feature-editor';
import DialogTabs from '~/components/dialogs/DialogTabs';

import FeaturePointsForm from './FeaturePointsForm';
import GeneralPropertiesForm from './GeneralPropertiesForm';

const FeatureEditorDialogPresentation = (props) => {
  const {
    feature,
    featureId,
    onClose,
    onRemoveFeature,
    onTabSelected,
    open,
    selectedTab,
  } = props;
  const actions = [];
  let content;

  if (!feature) {
    content = (
      <DialogContent>
        <p>Feature does not exist</p>
      </DialogContent>
    );
  } else {
    switch (selectedTab) {
      case 'general':
        content = (
          <DialogContent>
            <GeneralPropertiesForm feature={feature} featureId={featureId} />
          </DialogContent>
        );
        break;

      default:
        content = (
          <DialogContent>
            <FeaturePointsForm feature={feature} featureId={featureId} />
          </DialogContent>
        );
    }
  }

  actions.push(
    <Button
      key='remove'
      color='secondary'
      disabled={!feature}
      onClick={onRemoveFeature}
    >
      Remove
    </Button>,
    <Button key='close' onClick={onClose}>
      Close
    </Button>
  );

  return (
    <Dialog fullWidth open={open} maxWidth='sm' onClose={onClose}>
      <DialogTabs value={selectedTab} onChange={onTabSelected}>
        <Tab value='general' label='General' />
        <Tab value='points' label='Points' />
      </DialogTabs>
      {content}
      <DialogActions>{actions}</DialogActions>
    </Dialog>
  );
};

FeatureEditorDialogPresentation.propTypes = {
  feature: PropTypes.object,
  featureId: PropTypes.string,
  onClose: PropTypes.func,
  onRemoveFeature: PropTypes.func,
  onSubmit: PropTypes.func,
  onTabSelected: PropTypes.func,
  open: PropTypes.bool.isRequired,
  selectedTab: PropTypes.string,
};

FeatureEditorDialogPresentation.defaultProps = {
  open: false,
  selectedTab: 'general',
};

/**
 * Container of the dialog that shows the form where a given feature can
 * be edited.
 */
const FeatureEditorDialog = connect(
  // mapStateToProps
  (state) => {
    const {
      dialogVisible,
      featureId,
      selectedTab,
    } = state.dialogs.featureEditor;
    return {
      featureId,
      selectedTab,
      feature: state.features.byId[featureId],
      open: dialogVisible,
    };
  },
  // mapDispatchToProps
  (dispatch) => ({
    onClose() {
      dispatch(closeFeatureEditorDialog());
    },
    onRemoveFeature(featureId) {
      dispatch(removeFeature(featureId));
      dispatch(closeFeatureEditorDialog());
    },
    onTabSelected(_event, value) {
      dispatch(setFeatureEditorDialogTab(value));
    },
  }),
  // mergeProps
  (stateProps, dispatchProps) => ({
    ...stateProps,
    ...dispatchProps,
    onRemoveFeature: () => dispatchProps.onRemoveFeature(stateProps.featureId),
  })
)(FeatureEditorDialogPresentation);

export default FeatureEditorDialog;
