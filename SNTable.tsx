import styled from 'styled-components';
import {
  AuiText,
  AuiFlexGroup,
  AuiFlexItem,
  AuiButtonIcon,
  AuiButtonEmpty,
  AuiLoadingSpinner,
} from '@apple/aero-ui';
import { auiColorPrimary } from '~/styles/colors';
import isEmpty from 'lodash/isEmpty';
import { useDrilldownQuery } from '~/hooks/useQuery';
import { ModalProps } from '~/hooks/useModal';
import Table, { Row, HeaderRow } from '../charts/Table';
import columns from './columns';
import Icon from '../Icon';

const TABLE_OVERVIEW_HEIGHT = 40;

const ArrowButton = styled(AuiButtonEmpty)`
  .auiButtonEmpty__text {
    padding-top: 3px !important;
    display: flex;
  }
`;

const Details = styled(AuiText)`
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 5px !important;
  padding-right: 5px !important;
`;

const SNTable = ({
  row,
  val,
  modal: { maxInnerWidth, maxInnerHeight } = {},
  pageSize = undefined,
  showPagination = false,
}: {
  row: { values: { [name: string]: string | number } };
  val: string | undefined;
  showPagination?: boolean;
  pageSize?: number;
  modal?: ModalProps;
}) => {
  const {
    loading,
    error,
    data,
    minRow,
    maxRow,
    fetchNextPage,
    fetchPrevPage,
    fetchLastPage,
    fetchFirstPage,
    canNextPage,
    canPrevPage,
  } = useDrilldownQuery(row, val, pageSize);

  // since we know the modal size and the number of expected rows in the table,
  // we can predict the table height and the modal size during loading state
  let maxTableHeight = maxInnerHeight;
  if (showPagination) maxTableHeight -= TABLE_OVERVIEW_HEIGHT;

  const minTableHeight = Row.Height + 2 * HeaderRow.Height; // for now assume for most users header rows will split in two lines

  const nbRows = pageSize && +row.values[val] > pageSize ? pageSize : +row.values[val];

  let tableHeight = nbRows * Row.Height + 2 * HeaderRow.Height;
  if (tableHeight > maxTableHeight) tableHeight = maxTableHeight;
  if (tableHeight < minTableHeight) tableHeight = minTableHeight;

  let containerWidth = columns.reduce((acc, column) => acc + column.minWidth, 0);
  if (containerWidth > maxInnerWidth) containerWidth = maxInnerWidth;

  let containerHeight = tableHeight;
  if (showPagination) containerHeight += TABLE_OVERVIEW_HEIGHT;
  if (containerHeight > maxInnerHeight) containerHeight = maxInnerHeight;

  return (
    <AuiFlexGroup
      style={{ width: containerWidth, height: containerHeight }}
      direction="column"
      alignItems="center"
      justifyContent="flexStart"
      gutterSize="none"
    >
      {showPagination && (
        <AuiFlexGroup
          alignItems="center"
          justifyContent="flexStart"
          gutterSize="xs"
          style={{ width: '100%', flexGrow: 0 }}
        >
          <AuiFlexItem>
            <AuiFlexGroup alignItems="center" gutterSize="none">
              <AuiFlexItem grow={false}>
                <AuiFlexGroup gutterSize="none">
                  {canPrevPage || canNextPage ? (
                    <>
                      <ArrowButton
                        color="primary"
                        onClick={fetchFirstPage}
                        aria-label="First Page"
                        disabled={!canPrevPage}
                        flush="left"
                      >
                        <Icon
                          icon="doubleArrowLeft"
                          size={16}
                          color={canPrevPage ? auiColorPrimary : '#c2c2c2'} // manually set the disabled color, which is not part of the aui standard colors...
                        />
                      </ArrowButton>
                      <AuiButtonIcon
                        color="primary"
                        onClick={fetchPrevPage}
                        iconType="arrowLeft"
                        aria-label="Previous Page"
                        disabled={!canPrevPage}
                      />
                      <Details>
                        Showing details for tests{' '}
                        <b>
                          {minRow} - {maxRow}
                        </b>{' '}
                        of <b>{Math.ceil(+row.values[val])}</b>
                      </Details>

                      <AuiButtonIcon
                        color="primary"
                        onClick={fetchNextPage}
                        iconType="arrowRight"
                        aria-label="Next Page"
                        disabled={!canNextPage}
                      />
                      <ArrowButton
                        color="primary"
                        onClick={fetchLastPage}
                        aria-label="Last Page"
                        disabled={!canNextPage}
                      >
                        <Icon
                          icon="doubleArrowRight"
                          size={16}
                          color={canNextPage ? auiColorPrimary : '#c2c2c2'} // manually set the disabled color, which is not part of the aui standard colors...
                        />
                      </ArrowButton>
                    </>
                  ) : (
                    <Details>
                      Showing details for <b>{Math.ceil(+row.values[val])}</b> test
                      {row.values[val] > 1 ? 's' : ''}.
                    </Details>
                  )}
                </AuiFlexGroup>
              </AuiFlexItem>
            </AuiFlexGroup>
          </AuiFlexItem>
          {/* TODO : Removing now, later we can enable it, when we required */}
          {/* <AuiButtonEmpty iconType="importAction" primary disabled={loading} size="s">
            Test Details
          </AuiButtonEmpty>
          <AuiButtonEmpty iconType="importAction" flush="right" primary disabled={loading} size="s">
            Serial Number
          </AuiButtonEmpty> */}
        </AuiFlexGroup>
      )}

      {loading && (
        <AuiFlexItem grow={1} style={{ justifyContent: 'center' }}>
          <AuiLoadingSpinner />
        </AuiFlexItem>
      )}
      {!loading && error && (
        <AuiFlexItem grow={1} style={{ justifyContent: 'center' }}>
          <AuiText color="danger">Could not load test details.</AuiText>
        </AuiFlexItem>
      )}
      {!loading && !error && isEmpty(data) && (
        <AuiFlexItem grow={1} style={{ justifyContent: 'center' }}>
          <AuiText color="subdued">No data found.</AuiText>
        </AuiFlexItem>
      )}
      {!loading && !error && !isEmpty(data) && (
        <Table columns={columns} data={data} height={tableHeight} />
      )}
    </AuiFlexGroup>
  );
};

export default SNTable;
