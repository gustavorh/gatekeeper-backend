import { injectable } from "inversify";
import { IDateUtils } from "./interfaces/IDateUtils";

@injectable()
export class DateUtils implements IDateUtils {
  private readonly timezone = "America/Santiago";

  getCurrentChileTime(): Date {
    return new Date(
      new Date().toLocaleString("en-US", { timeZone: this.timezone })
    );
  }

  formatDateToChileString(date: Date): string {
    return date.toLocaleDateString("es-CL", {
      timeZone: this.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  parseChileDateString(dateString: string): Date {
    const date = new Date(dateString);
    return new Date(date.toLocaleString("en-US", { timeZone: this.timezone }));
  }

  isSameDay(date1: Date, date2: Date): boolean {
    const d1 = new Date(date1.toDateString());
    const d2 = new Date(date2.toDateString());
    return d1.getTime() === d2.getTime();
  }

  isWorkingDay(date: Date): boolean {
    const dayOfWeek = date.getDay();
    // 0 = Domingo, 6 = Sábado
    return dayOfWeek !== 0 && dayOfWeek !== 6;
  }

  getDayStartInChile(date?: Date): Date {
    const targetDate = date || this.getCurrentChileTime();
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    return dayStart;
  }

  getDayEndInChile(date?: Date): Date {
    const targetDate = date || this.getCurrentChileTime();
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);
    return dayEnd;
  }

  minutesBetween(start: Date, end: Date): number {
    if (end < start) {
      return 0;
    }
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  }

  hoursBetween(start: Date, end: Date): number {
    const minutes = this.minutesBetween(start, end);
    return Math.floor(minutes / 60);
  }
}
