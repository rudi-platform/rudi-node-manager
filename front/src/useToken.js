import { useState } from 'react';
import jwt from 'jsonwebtoken';
import moment from 'moment';

/**
 * Token hooks
 * @return {*} Token hooks
 */
export default function useToken() {
  const getToken = () => {
    const tokenString = sessionStorage.getItem('token');

    if (!tokenString || tokenString === 'undefined') {
      return null;
    }

    const userToken = JSON.parse(tokenString);
    if (moment.unix(jwt.decode(userToken?.token).exp).diff(moment()) <= 0) {
      sessionStorage.removeItem('token');
      return null;
    }
    return userToken?.token;
  };

  const [token, setToken] = useState(getToken());

  const saveToken = (userToken) => {
    if (userToken) {
      sessionStorage.setItem('token', JSON.stringify(userToken));
      setToken(userToken.token);
    } else {
      sessionStorage.removeItem('token');
      setToken(userToken);
    }
  };

  return {
    setToken: saveToken,
    token,
  };
}
