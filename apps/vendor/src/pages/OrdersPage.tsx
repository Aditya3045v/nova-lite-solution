import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { CalendarRange, Package, Search, X } from 'lucide-react';
import { formatDate, formatDateTime, formatINR, formatNumber, friendlyError, ORDER_STATUS_META, ORDER_STATUSES, type OrderStatus } from '@novalite/shared';
import {
  Button, Card, EmptyState, ErrorState, Input, PageHeader, Pagination, TableSkeleton, TableWrap, Table, TBody, TD, TH, THead, TR, Tabs, buttonClasses,
} from '@novalite/ui';
import { OrderRow } from '@/components/OrderRow';
import { OrderStatusBadge } from '@/components/StatusBadges';
import { useDebounce } from '@/hooks/useDebounce';
import { useTitle } from '@/hooks/useTitle';
import { fetchOrderCounts, fetchOrders, ORDER_PAGE_SIZE, qk, type OrderListParams } from '@/lib/api';

type StatusFilter = OrderListParams['status'];
const STATUS_VALUES: StatusFilter[] = ['all', 'open', ...ORDER_STATUSES];

export function OrdersPage() {
  useTitle('My orders');
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = (STATUS_VALUES.includes(params.get('status') as StatusFilter) ? params.get('status') : 'all') as StatusFilter;
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const urlQ = params.get('q') ?? '';
  const [text, setText] = useState(urlQ);
  const debounced = useDebounce(text.trim(), 300);

  const update = (patch: Record<string, string>, resetPage = true) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (resetPage && !('page' in patch)) next.delete('page');
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if (debounced !== urlQ) update({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const listParams: OrderListParams = useMemo(() => ({ status, q: urlQ, from, to, page }), [status, urlQ, from, to, page]);
  const counts = useQuery({ queryKey: qk.orderCounts, queryFn: fetchOrderCounts });
  const list = useQuery({ queryKey: qk.orders(listParams), queryFn: () => fetchOrders(listParams), placeholderData: keepPreviousData });

  const tabs = [
    { value: 'all', label: 'All', count: counts.data?.all },
    { value: 'open', label: 'Open', count: counts.data?.open },
    ...ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_META[s].label.replace(' review', ''), count: counts.data?.[s] })),
  ];

  const filtered = Boolean(urlQ || from || to);
  const clear = () => {
    setText('');
    update({ q: '', from: '', to: '' });
  };
  const rows = list.data?.rows ?? [];
  const dateError = from && to && from > to ? 'Start date is after end date' : null;

  return (
    <div>
      <PageHeader
        title="My orders"
        description="Track every order from review to delivery."
        actions={<Link to="/products" className={buttonClasses('primary', 'sm')}>New order</Link>}
      />

      <Tabs value={status} onValueChange={(v) => update({ status: v === 'all' ? '' : v })} items={tabs} className="mb-4" />

      <Card>
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 md:flex-row md:items-end">
          <Input
            type="search"
            label="Order number"
            placeholder="e.g. NL-2609"
            value={text}
            onChange={(e) => setText(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            containerClassName="md:w-64"
          />
          <div className="grid grid-cols-2 gap-3 md:flex">
            <Input type="date" label="From" value={from} max={to || undefined} onChange={(e) => update({ from: e.target.value })} containerClassName="md:w-44" />
            <Input type="date" label="To" value={to} min={from || undefined} onChange={(e) => update({ to: e.target.value })} containerClassName="md:w-44" error={dateError} />
          </div>
          {filtered && (
            <Button variant="ghost" size="md" onClick={clear} leftIcon={<X className="h-4 w-4" />}>Clear</Button>
          )}
        </div>

        {list.isError ? (
          <ErrorState message={friendlyError(list.error)} onRetry={() => list.refetch()} />
        ) : list.isLoading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={filtered ? <CalendarRange className="h-6 w-6" /> : <Package className="h-6 w-6" />}
            title={filtered ? 'No orders match these filters' : status === 'all' ? 'No orders yet' : `No ${status === 'open' ? 'open' : ORDER_STATUS_META[status as OrderStatus].label.toLowerCase()} orders`}
            description={filtered ? 'Try a different order number or date range.' : 'Orders you place will appear here with live status updates.'}
            action={filtered ? <Button variant="outline" size="sm" onClick={clear}>Clear filters</Button> : <Link to="/products" className={buttonClasses('primary', 'sm')}>Browse products</Link>}
          />
        ) : (
          <div className={list.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
            <div className="divide-y divide-ink-100 md:hidden">
              {rows.map((o) => <OrderRow key={o.id} order={o} />)}
            </div>
            <TableWrap className="hidden md:block">
              <Table>
                <THead>
                  <tr>
                    <TH>Order</TH>
                    <TH>Placed</TH>
                    <TH>Status</TH>
                    <TH className="text-right">Products</TH>
                    <TH className="text-right">Units</TH>
                    <TH className="text-right">Total</TH>
                  </tr>
                </THead>
                <TBody>
                  {rows.map((o) => (
                    <TR key={o.id} onClick={() => navigate(`/orders/${o.id}`)}>
                      <TD>
                        <Link to={`/orders/${o.id}`} className="font-mono font-semibold text-ink-950 hover:text-brand-700" onClick={(e) => e.stopPropagation()}>
                          {o.order_number}
                        </Link>
                      </TD>
                      <TD title={formatDateTime(o.created_at)}>{formatDate(o.created_at)}</TD>
                      <TD><OrderStatusBadge status={o.status} /></TD>
                      <TD className="text-right tabular-nums">{o.item_count}</TD>
                      <TD className="text-right tabular-nums">{formatNumber(o.total_units)}</TD>
                      <TD className="text-right font-semibold tabular-nums text-ink-950">{formatINR(o.total_amount)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
            {(list.data?.total ?? 0) > ORDER_PAGE_SIZE && (
              <Pagination page={page} pageSize={ORDER_PAGE_SIZE} total={list.data?.total ?? 0} onPage={(p) => update({ page: p > 1 ? String(p) : '' }, false)} />
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
