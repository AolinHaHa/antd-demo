import { useEffect, useState, useRef } from "react";

export type QueryProps<ResponseType, PayloadType = undefined> = {
  loading: boolean;
  loaded: boolean;
  error: any;
  data: ResponseType;
  fetch: (
    payload?: PayloadType | undefined,
    params?: (string | number)[],
    options?: FetchOptions<ResponseType, PayloadType>
  ) => Promise<ResponseType>;
  cancel: () => void;
};

export type QueryOptions<ResponseType, PayloadType> = {
  silent?: boolean; //demo中不需要使用，但是一个有用的flag可以让我们的fetch running behind the scense..
  loadOnMount?: boolean;
  initialLoaded?: boolean;
  allowConcurrent?: boolean;
  LOCAL_DEV_ONLY__mockData?: (
    ...params: Parameters<QueryProps<ResponseType, PayloadType>["fetch"]>
  ) => {
    data: ResponseType;
    timeout: number;
  };
  formatter?: (data: any) => ResponseType;
  resultType?: "json" | "text";
  headers?: { [name: string]: string };
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: PayloadType;
  [name: string]: any;
};

export type FetchOptions<ResponseType, PayloadType> = Omit<
  QueryOptions<ResponseType, PayloadType>,
  "loadOnMount" | "initialLoaded" | "allowConcurrent"
>;

export type QueryCancelled = { cancelled: true };

/**
 * 暂不使用mockRes
 */
// type MockResponse<ResponseType> = {
//   status: number;
//   json: () => ResponseType;
//   text: () => ResponseType;
// };

/**
 * mock response
 * 测试使用mock response
 */
// function getMockFetch<ResponseType, PayloadType>({
//   timeout,
//   data,
// }: ReturnType<
//   QueryOptions<ResponseType, PayloadType>["LOCAL_DEV_ONLY__mockData"]
// >): () => Promise<MockResponse<ResponseType>> {
//   return async () =>
//     new Promise((resolve) =>
//       setTimeout(
//         () =>
//           resolve({
//             status: 200,
//             json: () => data,
//             text: () => data,
//           }),
//         timeout
//       )
//     );
// }

function useQuery<ResponseType, PayloadType = undefined>(
  url: string,
  options: QueryOptions<ResponseType, PayloadType> | undefined = undefined
): QueryProps<ResponseType, PayloadType> | any {
  const {
    loadOnMount,
    initialLoaded,
    allowConcurrent,
    formatter,
    ...fetchOptions
  } = options || {};
  const controller = useRef<AbortController>();

  const [state, setState] = useState({
    loading: loadOnMount ?? true,
    loaded: initialLoaded ?? false,
    error: undefined,
    data: undefined,
  });

  const fetchData = async (
    payload: PayloadType | undefined = undefined,
    params: (string | number)[] | undefined = undefined,
    options: QueryOptions<ResponseType, PayloadType> | undefined = undefined
  ) => {
    const {
      resultType,
      method,
      headers,
      body,
      silent,
      LOCAL_DEV_ONLY__mockData,
      ...otherOptions
    } = {
      ...fetchOptions,
      ...options,
    };

    try {
      !silent &&
        setState({ ...state, loading: true, loaded: false, error: undefined });
      const isPost = !!(payload || body);

      const fetchFn = fetch;
      /**
       * 如果使用mockRes 我们可以使用以下条件逻辑
       */
      // const fetchFn = LOCAL_DEV_ONLY__mockData
      //   ? getMockFetch<ResponseType, PayloadType>(
      //       LOCAL_DEV_ONLY__mockData(payload, params, options)
      //     )
      //   : fetch;

      if (allowConcurrent === false && controller.current)
        controller.current.abort(); // 取消之前还未完成的请求
      controller.current = new AbortController();

      // 处理method, header, payload 以及其他， 例如cookies etc.
      const result = await fetchFn(
        `${url}${params ? `/${params.join("/")}` : ""}`,
        {
          method: method || (isPost ? "POST" : "GET"),
          headers: {
            ...(isPost && { "Content-Type": "application/json" }),
            ...headers,
          },
          ...((payload || body) && { body: JSON.stringify(payload || body) }),
          ...otherOptions,
          signal: controller.current.signal,
        }
      );
      console.log("rrr", result);

      let data: any;

      try {
        data = await (resultType ? result[resultType]() : result.json());
      } catch (e) {
        /**
         * 暂不做特殊处理，虽然期待所有endpoint必须返回content
         * 但是我们还是需要尝试parsing
         */
      }

      /**
       * if session expired from service check
       * we can handle from here in certain response conditions
       * if (sessionExpired){
       *  // renew session
       * }
       */

      !silent && setState({ ...state, loading: false, loaded: true, data });

      return formatter ? formatter(data) : data;
    } catch (e) {
      if (e.name === "AbortError") return { cancelled: true };
      else {
        console.error(e);
        setState({ ...state, loading: false, loaded: true, error: e });
      }
    }
  };

  const cancel = () => {
    if (controller.current && !controller.current.signal?.aborted) {
      controller.current.abort();
    }
    setState({ ...state, loading: false, loaded: false, error: undefined });
  };

  useEffect(() => {
    if (loadOnMount !== false) fetchData();
  }, []);

  return { ...state, fetch: fetchData, cancel };
}

export default useQuery;
