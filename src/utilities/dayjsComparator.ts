import { Dayjs } from "dayjs";

export default function dayjsComparator(a: Dayjs | null, b: Dayjs | null): number {
    if (b) {
        if (a) {
            // If both times are not null, the earlier time goes before the later time.
            return a.diff(b);
        }
        // If `a` is null but `b` is not null, `b` goes before `a`.
        return 1;
    }
    if (a) {
        // If `a` is not null but `b` is null, `a` goes before `b`.
        return -1;
    }
    // If both times are null, neither goes before the other.
    return 0;
}
