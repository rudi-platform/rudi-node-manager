import React from 'react'

import { DefaultErrorOption, ModalContext } from '../components/modals/genericModalContext'

/**
 * defaultErrorHandler hooks
 * @return {*} defaultErrorHandler hooks
 */
export default function useDefaultErrorHandler() {
  const { changeOptions, toggle } = React.useContext(ModalContext)
  const errorHandler = (err) => {
    // console.error(err)
    const options = DefaultErrorOption
    if (!err.response) {
      options.text = [`${err.message}`]
    } else {
      if (err.response.data?.message) {
        options.text = [`${err.response.data.message}`]
        if (err.response.data.moreInfo?.message)
          options.text.push(`${err.response.data.moreInfo.message}`)
      } else options.text = [`${err.response.data}`]
    }

    changeOptions(options)
    toggle()
  }

  return {
    defaultErrorHandler: errorHandler,
  }
}
