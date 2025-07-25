export type ChartData = {
  date: string;
  baseCurrencyPrice: number;
  targetCurrencyPrice: number;
};

export type ChartDataResponse = {
  data: ChartData[];
  baseCurrency: string;
  targetCurrency: string;
};
