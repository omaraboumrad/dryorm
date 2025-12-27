import { useCallback } from 'react';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { execute as executeApi } from '../lib/api';
import { isMobile } from '../lib/utils';

/**
 * Hook for executing code
 */
export function useExecute() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const execute = useCallback(async (forceRefresh = false) => {
    const code = state.code.trim();

    if (!code) {
      alert('Please enter some code to execute.');
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_RESULTS' });

    try {
      const payload = {
        code,
        database: state.database,
        orm_version: state.ormVersion,
        ignore_cache: state.ignoreCache || forceRefresh,
      };

      // Add ref info if present
      if (state.currentRefInfo) {
        payload.ref_type = state.currentRefInfo.type;
        payload.ref_id = state.currentRefInfo.id;
        payload.ref_sha = state.currentRefInfo.sha;
      }

      const response = await executeApi(payload);

      // Handle different response types
      if (response.event === 'job-done') {
        const result = response.result || {};

        // Build line to query map
        const lineToQueryMap = new Map();
        if (result.queries) {
          result.queries.forEach((query, index) => {
            if (query.line !== undefined) {
              if (!lineToQueryMap.has(query.line)) {
                lineToQueryMap.set(query.line, []);
              }
              lineToQueryMap.get(query.line).push({ ...query, index });
            }
          });
        }

        dispatch({
          type: 'SET_RESULTS',
          payload: {
            output: result.output || '',
            queries: result.queries || [],
            returnedData: result.returned_data || null,
            erdLink: result.erd_link || null,
            htmlTemplate: result.html_template || null,
          },
        });

        dispatch({ type: 'SET_LINE_QUERY_MAP', payload: lineToQueryMap });

        // Auto-switch to result tab on mobile
        if (isMobile()) {
          dispatch({ type: 'SET_SHOW_RESULT', payload: true });
        }
      } else if (response.error) {
        // Handle error responses (job-code-error, job-internal-error, etc.)
        dispatch({
          type: 'SET_ERROR',
          payload: response.error || 'An error occurred',
        });
      }
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err.message || 'Failed to execute code',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.code, state.database, state.ormVersion, state.ignoreCache, state.currentRefInfo, dispatch]);

  return { execute, loading: state.loading };
}

export default useExecute;
