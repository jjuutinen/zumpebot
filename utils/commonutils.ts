export const rn = (x?: number) => {
    const rn = '\r\n';
    if (!x) return rn;

    let output = "";
    for (let i = 0; i < x; i++) {
        output += rn;
    }

    return output;
};

export const distinct = (values: number[] | string[]) => {
    const output = [];

    values.forEach(x => {
        if (output.includes(x))
            return;

        output.push(x);
    });

    return output;
};