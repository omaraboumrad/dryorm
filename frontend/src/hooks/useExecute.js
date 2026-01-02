import { useCallback, useEffect, useRef } from 'react';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { execute as executeApi } from '../lib/api';
import { isMobile } from '../lib/utils';

/**
 * Parse Python traceback to extract line number from user code
 * Returns { lineNumber: number | null, message: string }
 */
function parseErrorLineNumber(errorMessage) {
  if (!errorMessage) return { lineNumber: null, message: errorMessage };

  // Match patterns like:
  // File "/app/app/models.py", line 15
  // File "<string>", line 10
  const lineMatch = errorMessage.match(/File\s+["'](?:\/app\/app\/models\.py|<string>)["'],\s+line\s+(\d+)/);

  if (lineMatch) {
    return {
      lineNumber: parseInt(lineMatch[1], 10),
      message: errorMessage,
    };
  }

  return { lineNumber: null, message: errorMessage };
}

/**
 * Hook for executing code
 */
export function useExecute() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const executeRef = useRef(null);

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

        // Build line to output map
        const lineToOutputMap = new Map();
        if (result.outputs) {
          result.outputs.forEach((output, index) => {
            const lineNumber = output.line_number;
            if (lineNumber !== undefined && lineNumber !== null) {
              if (!lineToOutputMap.has(lineNumber)) {
                lineToOutputMap.set(lineNumber, []);
              }
              lineToOutputMap.get(lineNumber).push({ ...output, index });
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
        dispatch({ type: 'SET_LINE_OUTPUT_MAP', payload: lineToOutputMap });

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
        const errorText = response.error || 'An error occurred';
        const { lineNumber, message } = parseErrorLineNumber(errorText);

        // Build line to error map if we found a line number
        const lineToErrorMap = new Map();
        if (lineNumber !== null) {
          lineToErrorMap.set(lineNumber, [{ error: message, line_number: lineNumber }]);
        }

        dispatch({ type: 'SET_LINE_ERROR_MAP', payload: lineToErrorMap });
        dispatch({
          type: 'SET_ERROR',
          payload: errorText,
        });
      }
    } catch (err) {
      const errorText = err.message || 'Failed to execute code';
      const { lineNumber, message } = parseErrorLineNumber(errorText);

      // Build line to error map if we found a line number
      const lineToErrorMap = new Map();
      if (lineNumber !== null) {
        lineToErrorMap.set(lineNumber, [{ error: message, line_number: lineNumber }]);
      }

      dispatch({ type: 'SET_LINE_ERROR_MAP', payload: lineToErrorMap });
      dispatch({
        type: 'SET_ERROR',
        payload: errorText,
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.code, state.database, state.ormVersion, state.ignoreCache, state.currentRefInfo, dispatch]);

  // Keep ref updated for event handler
  executeRef.current = execute;

  // Listen for auto-execute events
  useEffect(() => {
    const handleAutoExecute = () => {
      if (executeRef.current) {
        executeRef.current(false);
      }
    };

    window.addEventListener('dryorm:execute', handleAutoExecute);
    return () => window.removeEventListener('dryorm:execute', handleAutoExecute);
  }, []);

  return { execute, loading: state.loading };
}

export default useExecute;
