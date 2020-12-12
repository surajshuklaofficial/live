import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import TimeAgo from 'react-timeago';

import { makeStyles } from '@material-ui/core/styles';

import StatusText from '~/components/StatusText';
import {
  abbreviateGPSFixType,
  getFlightModeLabel,
  getSemanticsForFlightMode,
  getSemanticsForGPSFixType,
} from '~/model/enums';
import { shortTimeAgoFormatter } from '~/utils/formatting';

const useStyles = makeStyles((theme) => ({
  root: {
    fontSize: 'small',

    '& .muted': {
      color: theme.palette.text.disabled,
    },
  },

  header: {
    textTransform: 'uppercase',
    color: theme.palette.text.secondary,
  },

  value: {
    textAlign: 'right',
  },

  separator: {},
}));

const naText = <span className='muted'>—</span>;

const formatNumberSafely = (x, digits = 0, unit = '') =>
  isNil(x)
    ? naText
    : typeof x === 'number'
    ? unit
      ? `${x.toFixed(digits)}${unit}`
      : x.toFixed(digits)
    : x;

const StatusSummaryMiniTable = ({
  gpsFix,
  heading,
  lastUpdated,
  localPosition,
  mode,
  position,
}) => {
  const classes = useStyles();
  const { lat, lon, amsl, agl } = position || {};
  const gpsFixType = gpsFix?.type;
  const gpsFixLabel = gpsFixType ? (
    <StatusText status={getSemanticsForGPSFixType(gpsFixType)}>
      {abbreviateGPSFixType(gpsFixType)}
    </StatusText>
  ) : (
    naText
  );
  const flightModeLabel = mode ? (
    <StatusText status={getSemanticsForFlightMode(mode)}>
      {getFlightModeLabel(mode)}
    </StatusText>
  ) : (
    naText
  );

  const rows = [
    ['Mode', flightModeLabel],
    'sep-1',
    ['GPS fix', gpsFixLabel],
    ['# sats', gpsFix?.numSatellites || naText],
    'sep0',
    ['Lat', formatNumberSafely(lat, 7, '°')],
    ['Lon', formatNumberSafely(lon, 7, '°')],
    ['AMSL', formatNumberSafely(amsl, 2, ' m')],
    ['AGL', formatNumberSafely(agl, 2, ' m')],
    'sep1',
  ];

  if (localPosition && Array.isArray(localPosition)) {
    rows.push(
      ['X', formatNumberSafely(localPosition[0], 2, ' m')],
      ['Y', formatNumberSafely(localPosition[1], 2, ' m')],
      ['Z', formatNumberSafely(localPosition[2], 2, ' m')]
    );
  }

  rows.push(['Heading', formatNumberSafely(heading, 1, '°')]);
  rows.push('sep2');
  rows.push([
    'Last seen',
    lastUpdated ? (
      <TimeAgo formatter={shortTimeAgoFormatter} date={lastUpdated} />
    ) : (
      naText
    ),
  ]);

  return (
    <table className={classes.root}>
      <tbody>
        {rows.map((row) =>
          Array.isArray(row) ? (
            <tr key={row[0]}>
              <td className={classes.header}>{row[0]}</td>
              <td className={classes.value}>{row[1]}</td>
            </tr>
          ) : (
            <tr key={row}>
              <td className={classes.separator} colSpan={2} />
            </tr>
          )
        )}
      </tbody>
    </table>
  );
};

StatusSummaryMiniTable.propTypes = {
  gpsFix: PropTypes.shape({
    type: PropTypes.number,
    numSatellites: PropTypes.number,
  }),
  heading: PropTypes.number,
  lastUpdated: PropTypes.number,
  localPosition: PropTypes.arrayOf(PropTypes.number),
  mode: PropTypes.string,
  position: PropTypes.shape({
    lat: PropTypes.number,
    lon: PropTypes.number,
    amsl: PropTypes.number,
    agl: PropTypes.number,
  }),
};

export default connect(
  // mapStateToProps
  (state, ownProps) => ({
    ...state.uavs.byId[ownProps.uavId],
  }),

  // mapDispatchToProps
  {}
)(StatusSummaryMiniTable);