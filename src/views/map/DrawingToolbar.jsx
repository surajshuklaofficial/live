import PropTypes from 'prop-types';
import React from 'react';

import IconButton from '@material-ui/core/IconButton';
import withTheme from '@material-ui/core/styles/withTheme';
import LocationOn from '@material-ui/icons/LocationOn';
import ShowChart from '@material-ui/icons/ShowChart';
import CropSquare from '@material-ui/icons/CropSquare';
import PanoramaFishEye from '@material-ui/icons/PanoramaFishEye';
import StarBorder from '@material-ui/icons/StarBorder';
import Tooltip from '~/components/Tooltip';

import partial from 'lodash-es/partial';
import { connect } from 'react-redux';

import { selectMapTool } from '../../actions/map';
import EditFeature from '../../icons/EditFeature';
import { Tool } from './tools';

/**
 * Presentation component for the drawing toolbar.
 *
 * @return {React.Element} the rendered component
 */
const DrawingToolbarPresentation = ({
  onToolSelected,
  selectedTool,
  theme,
}) => {
  const colorForTool = (tool) =>
    selectedTool === tool ? 'primary' : undefined;

  return (
    <div style={{ display: 'flex', flexFlow: 'column nowrap' }}>
      <Tooltip content='Add marker'>
        <IconButton onClick={partial(onToolSelected, Tool.DRAW_POINT)}>
          <LocationOn color={colorForTool(Tool.DRAW_POINT)} />
        </IconButton>
      </Tooltip>

      <Tooltip content='Draw path'>
        <IconButton onClick={partial(onToolSelected, Tool.DRAW_PATH)}>
          <ShowChart color={colorForTool(Tool.DRAW_PATH)} />
        </IconButton>
      </Tooltip>

      <Tooltip content='Draw circle'>
        <IconButton onClick={partial(onToolSelected, Tool.DRAW_CIRCLE)}>
          <PanoramaFishEye color={colorForTool(Tool.DRAW_CIRCLE)} />
        </IconButton>
      </Tooltip>

      <Tooltip content='Draw rectangle'>
        <IconButton onClick={partial(onToolSelected, Tool.DRAW_RECTANGLE)}>
          <CropSquare color={colorForTool(Tool.DRAW_RECTANGLE)} />
        </IconButton>
      </Tooltip>

      <Tooltip content='Draw polygon'>
        <IconButton onClick={partial(onToolSelected, Tool.DRAW_POLYGON)}>
          <StarBorder color={colorForTool(Tool.DRAW_POLYGON)} />
        </IconButton>
      </Tooltip>

      <Tooltip content='Edit feature'>
        <IconButton onClick={partial(onToolSelected, Tool.EDIT_FEATURE)}>
          <EditFeature color={colorForTool(Tool.EDIT_FEATURE)} />
        </IconButton>
      </Tooltip>
    </div>
  );
};

DrawingToolbarPresentation.propTypes = {
  onToolSelected: PropTypes.func,
  selectedTool: PropTypes.string,
  theme: PropTypes.object.isRequired,
};

/**
 * Drawing toolbar on the map.
 */
const DrawingToolbar = connect(
  // mapStateToProps
  (state) => ({ ...state.map.tools }),
  // mapDispatchToProps
  (dispatch) => ({
    onToolSelected(tool) {
      dispatch(selectMapTool(tool));
    },
  })
)(withTheme(DrawingToolbarPresentation));

export default DrawingToolbar;
