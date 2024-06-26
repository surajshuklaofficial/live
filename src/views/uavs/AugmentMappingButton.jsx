import React from 'react';
import { Translation } from 'react-i18next';
import { connect } from 'react-redux';

import Button from '@material-ui/core/Button';
import Shuffle from '@material-ui/icons/Shuffle';

import { augmentMappingAutomaticallyFromSpareDrones } from '~/features/mission/actions';
import { canAugmentMappingAutomaticallyFromSpareDrones } from '~/features/mission/selectors';

/**
 * Button that allows the user to augment the current mapping with spare
 * drones based on their current positions automatically.
 */
const AugmentMappingButton = (props) => (
  <Translation>
    {(t) => (
      <Button startIcon={<Shuffle />} {...props}>
        {t('augmentMappingButton.assignSparesToEmptySlots')}
      </Button>
    )}
  </Translation>
);

export default connect(
  // mapStateToProps
  (state) => ({
    disabled: !canAugmentMappingAutomaticallyFromSpareDrones(state),
  }),
  // mapDispatchToProps
  {
    onClick: augmentMappingAutomaticallyFromSpareDrones,
  }
)(AugmentMappingButton);
