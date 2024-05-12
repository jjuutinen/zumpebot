const hlFile = "C:\\temp\\liputon\\liputonhighlight.json";

const fs = require('fs-extra');

interface ILiputonHighlightItem {
    id: string;
    names: string[];
}

const addLiputonHighlight = async (name: string, id?: string): Promise<boolean> => {
    try {
        const existingItems = await fs.readJson(hlFile) as ILiputonHighlightItem[];

        if (!id) {
            existingItems.forEach(x => {
                if (!x.names.includes(name)) x.names.push(name);
            });
        }

        else {
            if (!existingItems.find(x => x.id === id))
                existingItems.push({ id: id, names: [name] });

            else if (existingItems.find(x => x.id === id)?.names.includes(name))
                return true;

            else existingItems.find(x => x.id === id).names.push(id);
        }

        await fs.writeJson(hlFile, existingItems);
        return true;
    }
    catch { return false; }

};

const removeLiputonHighlight = async (name: string, id?: string): Promise<boolean> => {
    try {
        const existingItems = await fs.readJson(hlFile) as ILiputonHighlightItem[];

        if (!id) existingItems.forEach(x => x.names = x.names.filter(n => n != name));

        else existingItems.find(x => x.id === id).names = existingItems.find(x => x.id === id).names.filter(n => n !== name);

        await fs.writeJson(hlFile, existingItems.filter(x => x.names.length > 0));

        return true;
    }
    catch { return false; }
};

const getUserLiputonHighlight = async (user: string): Promise<string[]> => {
    const existingItems = await fs.readJson(hlFile) as ILiputonHighlightItem[];

    const userItems = existingItems.filter(x => x.names.includes(user)).map(x => x.id);

    if (userItems && userItems.length > 0)
        return userItems;

    return [];
};

const getEventLiputonHighlight = async (id: string): Promise<string[]> => {
    const active = await fs.readJson(hlFile) as ILiputonHighlightItem[];

    const item = active.find(x => x.id === id);

    return item && item.names.length > 0 ? item.names : [];
};

module.exports = {
    addLiputonHighlight,
    removeLiputonHighlight,
    getUserLiputonHighlight,
    getEventLiputonHighlight
};