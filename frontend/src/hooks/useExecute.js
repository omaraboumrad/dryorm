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
            const lineNumber = query.line_number;
            if (lineNumber !== undefined && lineNumber !== null) {
              if (!lineToQueryMap.has(lineNumber)) {
                lineToQueryMap.set(lineNumber, []);
              }
              lineToQueryMap.get(lineNumber).push({ ...query, index });
            }
          });
        }

        // Handle returned data - can be a string (HTML template) or object (data)
        let returnedData = null;
        let htmlTemplate = null;
        if (typeof result.returned === 'string') {
          htmlTemplate = result.returned;
        } else if (result.returned) {
          returnedData = result.returned;
        }

        dispatch({
          type: 'SET_RESULTS',
          payload: {
            output: result.output || '',
            queries: result.queries || [],
            returnedData,
            erdLink: result.erd || null,
            htmlTemplate,
          },
        });

        dispatch({ type: 'SET_LINE_QUERY_MAP', payload: lineToQueryMap });

        // Auto-open HTML preview dialog when template is returned
        if (htmlTemplate) {
          dispatch({ type: 'TOGGLE_HTML_PREVIEW' });
        }

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
