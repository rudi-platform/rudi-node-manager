import PropTypes from 'prop-types'
import React, { createContext, useCallback, useContext, useState } from 'react'
import Toast from 'react-bootstrap/Toast'
import ToastContainer from 'react-bootstrap/ToastContainer'
import { CheckLg, ExclamationLg, InfoLg } from 'react-bootstrap-icons'

export const ToastContext = createContext()

const ToastIcon = ({ icon, color }) => (
  <span
    className="me-3 flex-shrink-0"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'white',
      border: '2px solid white',
      borderRadius: '50%',
      width: 20,
      height: 20,
      flexShrink: 0,
    }}
  >
    {React.cloneElement(icon, { size: 16, style: { color } })}
  </span>
)

const VARIANT_ICONS = {
  danger: <ToastIcon icon={<ExclamationLg />} color="var(--bs-danger)" />,
  success: <ToastIcon icon={<CheckLg />} color="#004680" />,
  warning: <ToastIcon icon={<ExclamationLg />} color="var(--bs-warning)" />,
  info: <ToastIcon icon={<InfoLg />} color="var(--bs-info)" />,
}

const VARIANT_BG = {
  danger: '#d14838',
  success: '#004680',
  warning: '#004680',
  info: '#0dcaf0',
}


export function useNotification() {
  const { addToast } = useContext(ToastContext)

  const notify = useCallback(
    (message, variant = 'info', delay = 5000) => addToast({ message, variant, delay }),
    [addToast]
  )

  const notifyError = useCallback(
    (err) => {
      let messages
      if (typeof err === 'string') {
        messages = err
      } else if (!err?.response) {
        messages = err?.message || JSON.stringify(err)
      } else if (err.response.data?.message) {
        const lines = [err.response.data.message]
        if (err.response.data.moreInfo?.message) lines.push(err.response.data.moreInfo.message)
        messages = lines.join(' — ')
      } else {
        const data = err.response?.data
        messages = data?.status === 'error' ? data.msg : JSON.stringify(data)
      }
      addToast({ message: messages, variant: 'danger', delay: 8000 })
    },
    [addToast]
  )

  const notifySuccess = useCallback(
    (message, delay = 4000) => addToast({ message, variant: 'success', delay }),
    [addToast]
  )

  const notifyWarning = useCallback(
    (message, delay = 6000) => addToast({ message, variant: 'warning', delay }),
    [addToast]
  )

  return { notify, notifyError, notifySuccess, notifyWarning }
}

// -------------------------------------------------------------------------------------------------
// Provider
// -------------------------------------------------------------------------------------------------

ToastProvider.propTypes = { children: PropTypes.node }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ message, variant = 'info', delay = 5000 }) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, variant, delay }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer className="p-3 position-fixed start-50 translate-middle-x" style={{ zIndex: 1100, width: '70%', top: '56px' }}>
        {toasts.map(({ id, message, variant, delay }) => (
          <Toast key={id} onClose={() => removeToast(id)} delay={delay} autohide style={{ width: '100%', backgroundColor: VARIANT_BG[variant] ?? undefined, border: 'none' }}>
            <Toast.Body className="text-white d-flex justify-content-between align-items-center" style={{ padding: '1rem' }}>
              <span className="d-flex align-items-center">
                {VARIANT_ICONS[variant]}
                {message}
              </span>
              <button
                type="button"
                className="btn-close btn-close-white ms-3 flex-shrink-0"
                onClick={() => removeToast(id)}
                aria-label="Fermer"
              />
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  )
}
