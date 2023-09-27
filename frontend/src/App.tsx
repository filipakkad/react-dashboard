import "./App.css";
import { useQuery } from "@tanstack/react-query";
import { queryTable } from "queries/fetch-table.query";
import { DataTable } from "./components/data-table/data-table";
import {
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
import { Typography } from 'antd';

const { Sider, Content, Header, Footer } = Layout;

const FilterDropdowns = ({
	columns,
	onChange,
	onRemove,
	value,
	isLoading,
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
				showSearch
			/>
			<Select
				value={value?.filterOption}
				onChange={(option) => onFilter({ filterOption: option })}
				className="w-full"
				placeholder="Filter type"
				options={[
					{ label: "contains exactly", value: FilterOption.containsExactly },
					{
						label: "not contains exactly",
						value: FilterOption.notContainsExactly,
					},
				]}
				size="middle"
				disabled={isLoading}
			/>
			<Select
				value={value.filterValue}
				onChange={(values) => onFilter({ filterValue: values })}
				mode="tags"
				className="w-full overflow-hidden"
				placeholder="Values"
				size="middle"
				tokenSeparators={[",", " ", "\t"]}
				disabled={isLoading}
				allowClear
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
	const [tableConfig, setTableConfig] = useSearchParamsState('config', {
		appliedFilters: [] as FilterDTO[],
		tableName: undefined as string | undefined,
		selectedColumns: [] as string[],
		pagination: {
			page: 1,
			perPage: 100,
		}
	})

	const [filters, setFilters] = React.useState<FilterDTO[]>([]);
	// const prevAppliedFilters = usePrevious(tableConfig.appliedFilters);

	const [isCollapsed, setIsCollapsed] = useSearchParamsState<boolean>(
		"collapsed",
		false
	);

	const { data, isLoading, isSuccess, isFetching } = useQuery({
		...queryTable({
			filters: Object.values(tableConfig.appliedFilters),
			tableName: tableConfig.tableName,
			page: tableConfig.pagination.page,
			perPage: tableConfig.pagination.perPage,
			columns: tableConfig.selectedColumns,
		}),
		keepPreviousData: true,
		refetchOnWindowFocus: false,
		enabled: !!tableConfig.tableName && !!tableConfig.pagination.page && !!tableConfig.pagination.perPage,
	});
	const { data: tablesList } = useQuery({
		...queryTablesList,
		refetchOnWindowFocus: false,
		keepPreviousData: true,
	});
	const { columns, count } = data || {};
	const refCount = useRef(count);

	React.useEffect(() => {
		if (count !== undefined && count !== null && refCount.current && refCount.current !== count) {
			refCount.current = count;
			setTableConfig((currConfig) => ({
				...currConfig,
				pagination: {
					...currConfig.pagination,
					page: 1,
				},
			}));
		} else if (!refCount?.current) {
			refCount.current = count;
		}
	}, [count, setTableConfig]);

	const onTableChange = (tableName: string) => {
		setTableConfig((prev) => ({
			...prev,
			appliedFilters: [],
			filters: [],
			tableName: tableName || "",
			selectedColumns: [],
			pagination: {
				...prev.pagination,
				page: 1,
			},
		}));
	};

	const onFilterChange = ({
		id,
		filter,
	}: {
		id: string;
		filter: FilterDTO;
	}) => {
		setFilters((prev) => prev.map((prevFilter) => {
			if (prevFilter.id === id) {
				return filter;
			}
			return prevFilter;
		}));
		setTableConfig((prev) => ({
			...prev,
			appliedFilters: prev.appliedFilters.map((prevFilter) => {
				if (prevFilter.id === id) {
					return filter;
				}
				return prevFilter;
			}),
		}));
	};

	const onAddFilter = () => {
		setFilters((prev) => ([
			...prev,
			{ id: uuidv4(), columnId: null, filterOption: null, filterValue: [] },
		] as FilterDTO[]));
	};

	const onRemoveFilter = (id: string) => {
		setFilters((prev) => prev.filter((filter) => filter.id !== id));
		setTableConfig((prev) => ({
			...prev,
			appliedFilters: prev.appliedFilters.filter((filter) => filter.id !== id),
		}));
	};

	const onFilter = () => {
		setTableConfig((prev) => {
			const newState = {
				...prev,
				filters: [],
				appliedFilters: [
					...prev.appliedFilters,
					...filters.filter(
						(filter) =>
							!!filter.columnId && !!filter.filterOption && !!filter.filterValue
					),
				]
			}
			setFilters([]);
			return newState;
	});
	};

	return (
		<>
			<Layout className="h-screen">
				<Header className="flex w-full bg-[rgba(24,141,138,1)]" />
				<Layout>
					<Sider
						collapsed={isCollapsed}
						onCollapse={() => setIsCollapsed((prev) => !prev)}
						collapsible={true}
						width={500}
						className="h-full fixed left-0 top-0 bottom-0 overflow-auto"
						theme="light"
					>
						<div
							className={clsx(
								"flex flex-col gap-4 p-8 transition-all w-[500px] absolute right-0 top-0"
							)}
						>
							<Select
								showSearch
								value={tableConfig.tableName}
								onSelect={onTableChange}
								className="w-full"
								placeholder="Select table"
								options={tablesList?.map((table) => ({
									label: table,
									value: table,
								}))}
								size="large"
								disabled={isFetching}
								filterOption={(inputValue, option) =>
									option!.value
										.toUpperCase()
										.indexOf(inputValue.toUpperCase()) !== -1
								}
							/>
							{isSuccess && columns && (
								<>
									<Select
											value={tableConfig.selectedColumns !== null ? tableConfig.selectedColumns : columns.map((column) => column.name)}
											onChange={(columns) => setTableConfig((prev) => ({ ...prev, selectedColumns: columns }))}
											className="w-full"
											placeholder="Select columns"
											options={columns.map((column) => ({
												label: column.name,
												value: column.id,
											}))}
											size="middle"
											mode="multiple"
											allowClear
									/>
									<Divider className="m-0" />
									{tableConfig.appliedFilters.map((filter) => {
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
									<Divider className="m-0" />
									{filters.map((filter) => {
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
								</>
							)}
							<div className="w-full flex gap-1 justify-end">
								<div className="flex justify-end">
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
								{ filters.length > 0 &&
								<div className="flex justify-end">
									<Button
										className="bg-[#1677ff]"
										size="large"
										onClick={onFilter}
										type="primary"
										disabled={!data || isLoading || isFetching}
										icon={<ArrowRightOutlined />}
									>
										Apply
									</Button>
								</div>}
							</div>
							<Divider className="m-0" />
							<div className="w-full justify-end flex">
								<Button
									icon={<DownloadOutlined />}
									disabled={isLoading || isFetching}
									onClick={() =>
										downloadFile({
											params: {
												filters: Object.values(tableConfig.appliedFilters),
												tableName: tableConfig.tableName,
												page: tableConfig.pagination.page,
												perPage: tableConfig.pagination.perPage,
												columns: tableConfig.selectedColumns,
											},
										})
									}
								>{`Export (${count ?? 0} rows)`}</Button>
							</div>
						</div>
					</Sider>
					<Layout>
						<Content className="overflow-auto bg-gray-300/30">
							<div className="w-full flex justify-between p-12 gap-8 h-full">
								{data ? (
									<div className="flex flex-col items-center w-full gap-4 h-full">
										<DataTable
											isLoading={isLoading || isFetching}
											tableData={data}
											footer={
												<div className="flex flex-col gap-1">
													<Pagination
														total={count}
														pageSize={tableConfig.pagination.perPage}
														disabled={isLoading}
														onChange={(page, pageSize) => {
															setTableConfig((prev) => ({
																...prev,
																pagination: {
																	perPage: pageSize,
																	page,
																},
															}));
														}}
														pageSizeOptions={[5, 10, 20, 50]}
														current={tableConfig.pagination.page}
														className="w-full flex justify-center flex-nowrap"
													/>
												</div>
											}
										/>
									</div>
								): (
									<div className="w-full h-full flex items-center justify-center flex-col">
										<Typography.Title>Welcome to TA Dashboard</Typography.Title>
										<Typography.Paragraph>Please select the data</Typography.Paragraph>
									</div>
								)}
							</div>
						</Content>
						<Footer style={{ textAlign: "center" }} className="">
							<Typography.Text>
									@2023 Data Science
							</Typography.Text>
						</Footer>
					</Layout>
				</Layout>
			</Layout>
		</>
	);
}

export default App;
