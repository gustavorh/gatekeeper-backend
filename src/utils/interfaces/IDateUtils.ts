export interface IDateUtils {
  getCurrentChileTime(): Date;
  formatDateToChileString(date: Date): string;
  parseChileDateString(dateString: string): Date;
  isSameDay(date1: Date, date2: Date): boolean;
  isWorkingDay(date: Date): boolean;
  getDayStartInChile(date?: Date): Date;
  getDayEndInChile(date?: Date): Date;
  minutesBetween(start: Date, end: Date): number;
  hoursBetween(start: Date, end: Date): number;
}
