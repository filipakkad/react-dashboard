import { useSearchParams } from 'react-router-dom';
import React, { useEffect } from 'react';

export const useSearchParamsState = <T extends unknown | [] | undefined, >(
  searchParamName: string,
  defaultValue: T,
): readonly [T, React.Dispatch<
  React.SetStateAction<T>
>] => {
  const [searchParams, setSearchParams] = useSearchParams();
  const acquiredSearchParam = JSON.parse(searchParams.get(searchParamName) || '{}') as T;

  const searchParamsState = acquiredSearchParam
  && (
    (typeof acquiredSearchParam === 'object' && Object.keys(acquiredSearchParam).length)
    || typeof acquiredSearchParam !== 'object'
  )
    ? acquiredSearchParam : defaultValue;

  const setSearchParamsState: React.Dispatch<React.SetStateAction<T>> = (newState) => {
    setSearchParams((prevSearchParams) => {
      const updatedSearchParams = new URLSearchParams(prevSearchParams.toString());
      updatedSearchParams.set(searchParamName, JSON.stringify(
        // eslint-disable-next-line @typescript-eslint/ban-types
        typeof newState === 'function' ? (newState as Function)(searchParamsState) : newState,
      ));
      return updatedSearchParams;
    }, { replace: true });
  };
  useEffect(() => {
    setSearchParamsState(searchParamsState);
  }, []);

  return [searchParamsState, setSearchParamsState];
};