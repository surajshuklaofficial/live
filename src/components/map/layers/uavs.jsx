import u from 'updeep'
import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import { layer } from 'ol-react'
import ActiveUAVsLayerSource from '../ActiveUAVsLayerSource'
import flock from '../../../flock'

import { colorPredicates } from '../features/UAVFeature'
const colors = ['pink', 'orange', 'yellow', 'green', 'blue', 'purple']

import RaisedButton from 'material-ui/RaisedButton'
import ActionSystemUpdateAlt from 'material-ui/svg-icons/action/system-update-alt'
import TextField from 'material-ui/TextField'

import { setLayerParameterById } from '../../../actions/layers'
import { showSnackbarMessage } from '../../../actions/snackbar'

import { updateUAVFeatureColorsSignal } from '../../../signals'

import { coordinateFromLonLat } from '../MapView'

const updatePredicates = (predicates, errorHandler) => {
  for (const color in predicates) {
    try {
      /*eslint no-new-func: "off" */
      colorPredicates[color] = new Function('id', `return ${predicates[color]}`)
    } catch (e) {
      errorHandler(`Invalid color predicate for ${color} --> ${e}`)
    }
  }
}

// === Settings for this particular layer type ===

class UAVsLayerSettingsPresentation extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      colorPredicates: props.layer.parameters.colorPredicates
    }

    this.makeChangeHandler_ = this.makeChangeHandler_.bind(this)
    this.handleClick_ = this.handleClick_.bind(this)
  }

  render () {
    const colorInputs = colors.map(color => (
      <TextField
        style={{marginTop: '-20px'}}
        key={`${color}_predicate_textfield`}
        name={`${color}_predicate_textfield`}
        floatingLabelText={color}
        value={this.state.colorPredicates[color]}
        onChange={this.makeChangeHandler_(color)} />
    ))
    return (
      <div>
        <p key={'header'}>Colors</p>
        {colorInputs}
        <br />
        <RaisedButton
          label={'Apply'}
          icon={<ActionSystemUpdateAlt />}
          onClick={this.handleClick_} />
      </div>
    )
  }

  componentWillReceiveProps (newProps) {
    updatePredicates(
      newProps.layer.parameters.colorPredicates,
      this.props.showMessage
    )
    updateUAVFeatureColorsSignal.dispatch()
  }

  makeChangeHandler_ (color) {
    return (event) => {
      this.setState(
        u.updateIn(`colorPredicates.${color}`, event.target.value, this.state)
      )
    }
  }

  handleClick_ () {
    this.props.setLayerParameter('colorPredicates', this.state.colorPredicates)
  }
}

UAVsLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,

  setLayerParameter: PropTypes.func,
  showMessage: PropTypes.func
}

export const UAVsLayerSettings = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    setLayerParameter: (parameter, value) => {
      dispatch(setLayerParameterById(ownProps.layerId, parameter, value))
    },
    showMessage: (message) => {
      dispatch(showSnackbarMessage(message))
    }
  })
)(UAVsLayerSettingsPresentation)

// === The actual layer to be rendered ===

class UAVsLayerPresentation extends React.Component {
  render () {
    if (!this.props.layer.visible) {
      return false
    }

    return (
      <div>
        <layer.Vector ref={this.context.assignActiveUAVsLayerRef_}
          updateWhileAnimating
          updateWhileInteracting
          zIndex={this.props.zIndex}>

          <ActiveUAVsLayerSource ref={this.context.assignActiveUAVsLayerSourceRef_}
            selection={this.props.selection}
            flock={flock}
            projection={this.props.projection} />

        </layer.Vector>
      </div>
    )
  }

  componentWillReceiveProps (newProps) {
    updatePredicates(
      newProps.layer.parameters.colorPredicates,
      console.log
    )
  }
}

UAVsLayerPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,
  zIndex: PropTypes.number,

  selection: PropTypes.arrayOf(PropTypes.string).isRequired,
  projection: PropTypes.func.isRequired
}

UAVsLayerPresentation.defaultProps = {
  projection: coordinateFromLonLat
}

UAVsLayerPresentation.contextTypes = {
  assignActiveUAVsLayerRef_: PropTypes.func,
  assignActiveUAVsLayerSourceRef_: PropTypes.func
}

export const UAVsLayer = connect(
  // mapStateToProps
  (state, ownProps) => ({
    selection: state.map.selection
  }),
  // mapDispatchToProps
  (dispatch, ownProps) => ({})
)(UAVsLayerPresentation)