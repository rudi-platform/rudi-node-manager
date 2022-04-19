import { useState } from 'react';

/**
 * Token hooks
 * @return {*} Token hooks
 */
export default function useToken() {
  // console.log('-- useToken');

  const getCookie = (name) => {
    // console.log('-- getCookie: '+document.cookie);
    return document.cookie
      ?.split('; ')
      ?.find((row) => row.startsWith(`${name}`))
      ?.split('=')[1];
  };

  const getToken = () => getCookie('publicToken');

  const [token, setToken] = useState(getToken());

  const updateToken = () => setToken(getCookie('publicToken'));

  return { token, updateToken };
}
