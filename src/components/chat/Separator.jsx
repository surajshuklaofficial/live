/**
 * @file React component showing a separator line in a chat session.
 */

import React, { PropTypes } from 'react'

export default class Separator extends React.Component {
  render () {
    const { message } = this.props
    return message
      ? <div className={'chat-separator'}><span>{message}</span></div>
      : <hr className={'chat-separator'} />
  }
}

Separator.propTypes = {
  message: PropTypes.string
}