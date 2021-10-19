import React from 'react';
import { ModalContext, DefaultErrorOption } from '../components/modals/ModalContext';

/**
 * defaultErrorHandler hooks
 * @return {*} defaultErrorHandler hooks
 */
export default function useDefaultErrorHandler() {
  const { changeOptions, toggle } = React.useContext(ModalContext);
  const errorHandler = (err) => {
    console.error(err);
    if (err.response) {
      const options = DefaultErrorOption;
      options.text = `${err.response.data}`;
      changeOptions(options);
      toggle();
    } else {
      const options = DefaultErrorOption;
      options.text = `${err.message}`;
      changeOptions(options);
      toggle();
    }
  };

  return {
    defaultErrorHandler: errorHandler,
  };
}
