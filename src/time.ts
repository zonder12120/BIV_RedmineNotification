import axios, { AxiosResponse } from 'axios';
import { Holiday } from './types';
import { Config } from './config';

// Самый корректный календарь, который включает в себя все не рабочие дни, в отличии от других бесплатных аналогов
const calendarUrl = `https://clients6.google.com/calendar/v3/calendars/en.russian%23holiday@group.v.calendar.google.com/events?calendarId=en.russian%23holiday%40group.v.calendar.google.com&singleEvents=true&eventTypes=default&eventTypes=focusTime&eventTypes=outOfOffice&timeZone=Z&maxAttendees=1&maxResults=250&sanitizeHtml=true&timeMin=${getCurrentYear()}-01-01T00%3A00%3A00Z&timeMax=${getCurrentYear() + 1}-01-01T00%3A00%3A00Z&key=${Config.GOOGLE_CALENDAR_KEY}`;

// Получаем по ссылке JSON с праздниками
async function fetchHolidays(): Promise<string[]> {
    try {
        const response: AxiosResponse<{ items: Holiday[] }> =
            await axios.get(calendarUrl);
        const datesList = response.data.items.map((item) => item.start.date);

        // Логирование для отладки
        // console.log('\nПолученные праздники');
        // console.log(datesList);

        return datesList;
    } catch (error) {
        console.error(
            `Ошибка при получении праздников: ${error} ${getCurrentTime()}`
        );
        return [];
    }
}

// Возвращаем true, если дата находится в массиве holidays
export async function isHoliday(date: string): Promise<boolean> {
    const holidays = await fetchHolidays();
    return holidays.includes(date);
}

// Проверка, рабочее ли время
export async function isWorkTime(date: number): Promise<boolean> {
    const newDate = new Date(date);
    const day = newDate.getDay();
    const hour = newDate.getHours();

    return !(
        day === 0 || // Воскресенье
        day === 6 || // Суббота
        (await isHoliday(newDate.toISOString().split('T')[0])) ||
        !(hour >= 9 && hour <= 19)
    );
}

// Получаем текущее время в формате "DD.MM.YYYY HH:MM:SS"
export function getCurrentTime(): string {
    return new Intl.DateTimeFormat('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(new Date());
}

export function getCurrentYear() {
    return new Date().getFullYear();
}
