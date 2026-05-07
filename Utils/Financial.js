
export const getFYRange = (fyString) => {
    if (!fyString) return null;

    
    const startYear = parseInt(fyString.split('-')[0]);
    
    
    const startDate = new Date(Date.UTC(startYear, 3, 1, 0, 0, 0)); 
    
    
    const endDate = new Date(Date.UTC(startYear + 1, 2, 31, 23, 59, 59)); 

    return {
        $gte: startDate,
        $lte: endDate
    };
};


export const getQuarterRange = (quarter, fyString) => {
    const startYear = parseInt(fyString.split('-')[0]);
    let start, end;

    switch (parseInt(quarter)) {
        case 1: // Apr - Jun
            start = new Date(Date.UTC(startYear, 3, 1));
            end = new Date(Date.UTC(startYear, 5, 30, 23, 59, 59));
            break;
        case 2: // Jul - Sep
            start = new Date(Date.UTC(startYear, 6, 1));
            end = new Date(Date.UTC(startYear, 8, 30, 23, 59, 59));
            break;
        case 3: // Oct - Dec
            start = new Date(Date.UTC(startYear, 9, 1));
            end = new Date(Date.UTC(startYear, 11, 31, 23, 59, 59));
            break;
        case 4: // Jan - Mar (Next Year)
            start = new Date(Date.UTC(startYear + 1, 0, 1));
            end = new Date(Date.UTC(startYear + 1, 2, 31, 23, 59, 59));
            break;
    }
    return { $gte: start, $lte: end };
};