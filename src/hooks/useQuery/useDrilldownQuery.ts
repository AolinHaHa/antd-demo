import { useState, useMemo, useEffect, useRef } from "react";
import useQuery from "../../useQuery";

type DrilldownData = {
  data: {
    list: { name: string; id: string }[];
    total: number;
  };
  success: boolean;
  message: string;
};

type DrilldownPayload = {
  data: {
    dataFilters: { [name: string]: string[] };
    pagination?: {
      numRows: number;
      pageId: number;
    };
  };
};

const useDrilldownQuery = (
  {
    values,
    testResult = undefined,
    upperLimit = undefined,
    lowerLimit = undefined,
    minValue = undefined,
    maxValue = undefined,
  }: {
    values?: { [name: string]: string | number | string[] | number[] };
    testResult?: "PASS" | "FAIL";
    upperLimit?: string;
    lowerLimit?: string;
    minValue?: string;
    maxValue?: string;
  },
  key: string,
  pageSize: number = 100
) => {
  const [pageId, setPageId] = useState(1);

  // 这里的nbPages可以是由其他逻辑组成，如果总页数可以从其他数据中获取
  const nbPages = values && useRef(Math.ceil(+values[key] / pageSize));

  // demo没有要求payload逻辑，但是如果需要我们也能在此query hook里进行处理，通常情况下我们需要使用dataFilter to deal with large dataset
  const payload = useMemo(() => {
    const additionalFilters = {
      ...(testResult && { testResult: [testResult] }),
      ...(upperLimit && { upperLimit: [upperLimit] }),
      ...(lowerLimit && { lowerLimit: [lowerLimit] }),
      ...(minValue && { minValue: [minValue] }),
      ...(maxValue && { maxValue: [maxValue] }),
    } as { [name: string]: string[] };

    /**
     * 以下代码为条件控制， adding few more logic dealing with query fomatters
     * const dataFilters = formatWidgetRunFilters(
        additionalFilters,
        );
     */

    const dataFilters = additionalFilters;

    return {
      data: {
        dataFilters,
        pagination: { numRows: pageSize, pageId },
      },
    };
  }, [values, pageId, testResult]);

  const state = useQuery<DrilldownData, DrilldownPayload>(
    `http://localhost:3002/api/getlist?page=${pageId}&pageSize=${pageSize}`
    // { body: payload }, demo暂时不需要payload，如需使用筛选等功能我们可以通过添加payload来实现，或者params
  );

  useEffect(() => {
    state.cancel(); // cancel any pending query before sending next one to avoid mixed states
    state.fetch();
  }, [pageId]);

  // 以下为pagination处理，从UI我们可以直接call以下
  const fetchNextPage = () => setPageId((prevPageId) => prevPageId + 1);
  const fetchPrevPage = () => setPageId((prevPageId) => prevPageId - 1);
  const fetchLastPage = () => nbPages && setPageId(nbPages.current);
  const fetchFirstPage = () => setPageId(1);

  const canNextPage = nbPages && pageId < nbPages.current;
  const canPrevPage = pageId > 1;

  const minRow = pageId * pageSize - pageSize + 1;
  let maxRow = pageId * pageSize;
  if (values && maxRow > +values[key]) maxRow = +values[key];

  return {
    ...state,
    fetchNextPage,
    fetchPrevPage,
    fetchLastPage,
    fetchFirstPage,
    canNextPage,
    canPrevPage,
    minRow,
    maxRow,
  };
};

export default useDrilldownQuery;
