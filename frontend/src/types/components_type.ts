export interface RmsRowType {
  id?: string | number;
  [key: string]: string | null | number | object | boolean | undefined;
}

export interface RmsColumnType<T = RmsRowType> {
  label: string | React.ReactNode;
  key: string;
  renderer: (
    row: T,
    stage?: string,
    ...args: any[]
  ) => React.ReactNode | string;
  loadingRenderer?: () => React.ReactNode | string; // Make optional
  allowSorting?: boolean;
}
