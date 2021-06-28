import { useState } from 'react';

/**
 * Token hooks
 * @return {*} Token hooks
 */
export default function useToken() {
  const getToken = () => {
    console.log(JSON.parse('true'));
    const tokenString = sessionStorage.getItem('token');

    if (!tokenString || tokenString === 'undefined') {
      return null;
    }

    const userToken = JSON.parse(tokenString);
    return userToken?.token;
  };

  const [token, setToken] = useState(getToken());

  const saveToken = (userToken) => {
    sessionStorage.setItem('token', JSON.stringify(userToken));
    setToken(userToken.token);
  };

  return {
    setToken: saveToken,
    token,
  };
}
