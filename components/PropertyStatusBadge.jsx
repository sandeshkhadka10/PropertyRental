// A listing with no status at all predates moderation and is treated as
// approved, which is exactly what the public queries do.
const STATUS_STYLES = {
    pending:{
        label:'Pending review',
        className:'bg-amber-100 text-amber-800 border-amber-200'
    },
    approved:{
        label:'Live',
        className:'bg-green-100 text-green-800 border-green-200'
    },
    rejected:{
        label:'Rejected',
        className:'bg-red-100 text-red-800 border-red-200'
    },
    flagged:{
        label:'Flagged',
        className:'bg-orange-100 text-orange-800 border-orange-200'
    }
};

const PropertyStatusBadge = ({status})=>{
    const style = STATUS_STYLES[status] || STATUS_STYLES.approved;

    return (
        <span
            className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${style.className}`}
        >
            {style.label}
        </span>
    );
};

export default PropertyStatusBadge;
