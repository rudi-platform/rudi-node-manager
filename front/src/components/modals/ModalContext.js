import React from 'react';
import PropTypes from 'prop-types';
import GenericModal, { useGenericModal, useGenericModalOptions } from '../modals/genericModal';

let ModalContext;
const { Provider } = (ModalContext = React.createContext());

const ModalProvider = ({ children }) => {
  const { toggle, visible } = useGenericModal();
  const { options, changeOptions } = useGenericModalOptions();
  return (
    <Provider value={{ toggle, visible, options, changeOptions }}>
      <GenericModal visible={visible} toggle={toggle} options={options}></GenericModal>
      {children}
    </Provider>
  );
};

const DefaultErrorOption = {
  text: ``,
  title: 'une erreur est survenue',
  type: 'error',
  buttons: [
    {
      text: 'Ok',
      action: () => {},
    },
  ],
};
const DefaultOkOption = {
  text: ``,
  title: 'succès',
  type: 'success',
  buttons: [
    {
      text: 'Ok',
      action: () => {},
    },
  ],
};
ModalProvider.propTypes = {
  children: PropTypes.node,
};

export { ModalContext, ModalProvider, DefaultErrorOption, DefaultOkOption };
