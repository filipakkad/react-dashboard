import "./App.css";
import { useQuery } from "@tanstack/react-query";
import { queryTable } from "queries/fetch-table.query";
import { DataTable } from "./components/data-table/data-table";
import {
	AutoComplete,
	Button,
	Divider,
	Layout,
	Pagination,
	Select,
} from "antd";
import React, { useRef } from "react";
import {
	PlusCircleOutlined,
	CloseCircleOutlined,
	DownloadOutlined,
	ArrowRightOutlined,
} from "@ant-design/icons";
import { ColNames, FilterDTO, FilterOption } from "./types";
import { v4 as uuidv4 } from "uuid";
import { queryTablesList } from "./queries/fetch-table-list.query";
import { downloadFile } from "./queries/download-file";
import { useSearchParamsState } from "./hooks/use-search-params-state";
import clsx from "clsx";

const { Sider, Content, Header, Footer } = Layout;

const FilterDropdowns = ({
	columns,
	onChange,
	onRemove,
	value,
	isLoading
}: {
	columns: ColNames;
	onChange: (filter: { id: string; filter: FilterDTO }) => void;
	value: FilterDTO;
	onRemove: (id: string) => void;
	isLoading: boolean;
}) => {
	const { id } = value;
	const onFilter = (changeState: Partial<FilterDTO>) => {
		const newState = { ...value, ...changeState };
		onChange({ id, filter: newState });
	};

	return (
		<div className="flex gap-2 h-fit w-full justify-between">
			<Select
				value={value?.columnId}
				onChange={(column) => onFilter({ columnId: column })}
				className="w-full"
				placeholder="Column"
				options={columns?.map((column) => ({
					label: column.name,
					value: column.id,
				}))}
				size="middle"
				disabled={isLoading}
			/>
			<Select
				value={value?.filterOption}
				onChange={(option) => onFilter({ filterOption: option })}
				className="w-full"
				placeholder="Filter type"
				options={[
					{ label: "contains exactly", value: FilterOption.containsExactly },
					{ label: "not contains exactly", value: FilterOption.notContainsExactly },
				]}
				size="middle"
				disabled={isLoading}
			/>
			<Select
				value={value.filterValue}
				onChange={(values) => onFilter({ filterValue: values })}
				mode="tags"
				className="w-full"
				placeholder="Values"
				size="middle"
				tokenSeparators={[",", " ", "\t"]}
				disabled={isLoading}
			/>
			<div className="w-min">
				<Button
					onClick={() => onRemove(id)}
					className="bg-[#ffffff] !w-12"
					type="dashed"
					icon={<CloseCircleOutlined />}
					size="middle"
					disabled={isLoading}
				/>
			</div>
		</div>
	);
};

function App() {
	const [appliedFilters, setAppliedFilters] = useSearchParamsState<FilterDTO[]>(
		"filters",
		[]
	);
	const [filters, setFilters] = React.useState<FilterDTO[]>(appliedFilters);
	const [tableName, setTableName] = useSearchParamsState<string>("table", "");
	const [localTableName, setLocalTableName] = React.useState<string>(tableName || "");
	const [pagination, setPagination] = useSearchParamsState("pagination", {
		page: 1,
		perPage: 100,
	});
	const [isCollapsed, setIsCollapsed] = useSearchParamsState<boolean>('collapsed', false);

	const { data, isLoading, isSuccess, isFetching } = useQuery({
		...queryTable({
			filters: Object.values(appliedFilters),
			tableName,
			page: pagination.page,
			perPage: pagination.perPage,
		}),
		keepPreviousData: true,
		refetchOnWindowFocus: false,
		enabled: !!tableName && !!pagination.page && !!pagination.perPage,
	});
	const { data: tablesList } = useQuery({
		...queryTablesList,
		refetchOnWindowFocus: false,
		keepPreviousData: true,
	});
	const { columns, count } = data || {};
	const refCount = useRef(count);

	React.useEffect(() => {
		if (count !== undefined && count !== null && refCount.current !== count) {
			refCount.current = count;
			setPagination((currPagination) => {
				if(currPagination.page > 1) {
					return { ...currPagination, page: 1 }
				}
				return currPagination;
			})
		}
	}, [count, setPagination]);

	const resetFilters = () => {
		setFilters([]);
		setAppliedFilters([]);
		setPagination({ page: 1, perPage: 5 });
	};

	const onTableChange = (tableName: string) => {
		resetFilters();
		setTableName(tableName);
	};

	const onFilterChange = ({
		id,
		filter,
	}: {
		id: string;
		filter: FilterDTO;
	}) => {
		setFilters((prev) => {
			return prev.map((prevFilter) => {
				if (prevFilter.id === id) {
					return filter;
				}
				return prevFilter;
			});
		});
	};

	const onAddFilter = () => {
		setFilters((prev) => {
			const newState = [
				...prev,
				{ id: uuidv4(), columnId: null, filterOption: null, filterValue: [] },
			];
			return newState as FilterDTO[];
		});
	};

	const onRemoveFilter = (id: string) => {
		setFilters((prev) => {
			return [...prev].filter((filter) => filter.id !== id);
		});
	};

	const onFilter = () => {
		setAppliedFilters(filters.filter((filter) => !!filter.columnId && !!filter.filterOption && !!filter.filterValue));
	};

	return (
		<>
			<Layout className="h-screen">
				<Header className="flex w-full" />
				<Layout>
					<Sider collapsed={isCollapsed} onCollapse={() => setIsCollapsed((prev) => !prev)} collapsible width={500} className="h-full fixed left-0 top-0 bottom-0 overflow-auto" theme='light'>
						<div className={clsx('flex flex-col gap-4 p-8 transition-all w-[500px] absolute right-0 top-0')}>
							<AutoComplete
								onSelect={onTableChange}
								value={localTableName}
								onChange={(value) => setLocalTableName(value)}
								className="w-full"
								placeholder="Select table"
								options={tablesList?.map((table) => ({
									label: table,
									value: table,
								}))}
								size="large"
								disabled={isFetching}
								filterOption={(inputValue, option) =>
									option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
								}
							/>
							{isSuccess && columns &&
								filters.map((filter) => {
									return (
										<FilterDropdowns
											key={filter.id}
											onRemove={onRemoveFilter}
											value={filter}
											onChange={onFilterChange}
											columns={columns}
											isLoading={isLoading || isFetching}
										/>
									);
								})}
							<div className="w-full flex justify-end">
								<Button
									onClick={onAddFilter}
									className="bg-[#ffffff]"
									type="dashed"
									icon={<PlusCircleOutlined />}
									size="large"
									disabled={isLoading || isFetching}
								>
									Add filter
								</Button>
							</div>
							<div className="w-full flex justify-end">
								<Button
									className="bg-[#1677ff]"
									size="large"
									onClick={onFilter}
									type="primary"
									loading={isLoading || isFetching}
									disabled={isLoading || isFetching}
									icon={<ArrowRightOutlined />}
								>
									Apply
								</Button>
							</div>
							<Divider />
							<div className="w-full justify-end flex">
								<Button
									icon={<DownloadOutlined />}
									disabled={isLoading || isFetching}
									onClick={() =>
										downloadFile({
											params: {
												filters: Object.values(appliedFilters),
												tableName,
												page: pagination.page,
												perPage: pagination.perPage,
											},
										})
									}
								>{`Export (${count ?? 0} rows)`}</Button>
							</div>
						</div>
					</Sider>
					<Layout>
						<Content className="overflow-auto bg-gray-300">
							<div className="w-full flex justify-between p-12 gap-8 h-full">
								{data && (
									<div className="flex flex-col items-center w-full gap-4 h-full">
										<DataTable
											isLoading={isLoading || isFetching}
											tableData={data}
											footer={
												<div className="flex flex-col gap-1">
													<Pagination
														total={count}
														pageSize={pagination.perPage}
														disabled={isLoading}
														onChange={(page, pageSize) => {
															setPagination({ page, perPage: pageSize });
														}}
														pageSizeOptions={[5, 10, 20, 50]}
														current={pagination.page}
														className="w-full flex justify-center flex-nowrap"
													/>
												</div>
											}
										/>
									</div>
								)}
							</div>
						</Content>
						<Footer style={{ textAlign: "center" }}>Gen Corporation</Footer>
					</Layout>
				</Layout>
			</Layout>
		</>
	);
}

export default App;
