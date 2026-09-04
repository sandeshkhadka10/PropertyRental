// Timestamps as a reader wants them: "3 hours ago" while that is the most
// useful thing to say, the full date once it is not. The absolute value always
// stays available as a tooltip, so nothing is actually lost.

const DIVISIONS = [
    {amount:60, unit:'second'},
    {amount:60, unit:'minute'},
    {amount:24, unit:'hour'},
    {amount:7, unit:'day'},
    {amount:4.34524, unit:'week'},
    {amount:12, unit:'month'},
    {amount:Number.POSITIVE_INFINITY, unit:'year'}
];

const relativeFormat = new Intl.RelativeTimeFormat(undefined,{numeric:'auto'});

export const formatRelativeTime = (value)=>{
    const date = new Date(value);
    if(Number.isNaN(date.getTime())){
        return '';
    }

    let duration = (date.getTime() - Date.now()) / 1000;

    for(const division of DIVISIONS){
        if(Math.abs(duration) < division.amount){
            return relativeFormat.format(Math.round(duration),division.unit);
        }
        duration /= division.amount;
    }

    return date.toLocaleDateString();
};

// The tooltip behind the relative label.
export const formatDateTime = (value)=>{
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
};

// Heading for a day's worth of rows. Today and yesterday are named rather than
// dated - a date the reader has to work out is worse than no date at all.
export const formatDayGroup = (value)=>{
    const date = new Date(value);
    if(Number.isNaN(date.getTime())){
        return '';
    }

    const startOfDay = (d)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();
    const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);

    if(days <= 0){
        return 'Today';
    }
    if(days === 1){
        return 'Yesterday';
    }
    if(days < 7){
        return date.toLocaleDateString(undefined,{weekday:'long'});
    }

    return date.toLocaleDateString(undefined,{
        day:'numeric',
        month:'short',
        year:date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric'
    });
};
