import { rn } from "./utils/commonutils";
import { LiputonUtils } from "./utils/liputonutils";

const { getEventLiputonHighlight } = require("./liputon_highlight.ts");
const fs = require('fs-extra');

const storeFilePathBase = "C:\\temp\\liputon\\";
const liputonUri = "https://api.liputon.fi/v1/events/";
const liputonListUri = "https://api.liputon.fi/v1/events/insell";

export interface ILiputonResult {
    id: string;
    event: ILiputonEvent;
    tickets: ILiputonTicket[];
}

export interface ILiputonResultPlain {
    event: any;
    tickets: any[];
}

export interface ILiputonEvent {
    name: string;
    image: string;
    ticket_amount: number;
}

export interface ILiputonTicket {
    id: number;
    name: string;
    price: number;
    orig_price: number;
}

export interface ILiputonListResult {
    all_events: ILiputonListItem[];
}

export interface ILiputonListItem {
    id: number;
    name: string;
    tiketti_link: string;
    ticket_amount: number;
}

const getLiputonStoredInfo = async (id: string): Promise<ILiputonResult | null> => {
    const filename = `${storeFilePathBase}${id}.json`;
    const exists = await fs.pathExists(filename) as boolean;

    if (!exists) return null;

    const response = await fs.readJson(filename).catch(() => null);
    return response;
};

const refreshAllLiputonItems = async (channel: any) => {
    const active = await getActiveLiputonTrackings();

    active.forEach(async x => await refreshLiputonItem(x, channel));
};

const fetchLiputonInfo = async (id: string) => {
    const response = await fetch(`${liputonUri}${id}.json`, { method: 'GET' });

    const result = await response.json();

    if (!!result.error)
        return null;

    const res = LiputonUtils.mapLiputonResultObject(id, result as ILiputonResultPlain);

    return res;
};

const fetchLiputonInfoString = async (param: string) => {
    if (param.length < 3) return;

    const response = await fetch(liputonListUri, { method: 'GET' });

    const list = await response.json() as ILiputonListResult;

    const result = list.all_events.find(x => x.name.toString().toLowerCase().includes(param));

    if (!result) return null;

    return await fetchLiputonInfo(result.id.toString());
};

const refreshLiputonItem = async (id: string, channel?: any) => {
    const result = await fetchLiputonInfo(id);
    await refreshLatestLiputonInfo(result, channel);
};


const setStoredTicket = async (data: ILiputonResult) =>
    await fs.writeJson(`${storeFilePathBase}${data.id}.json`, data);


const refreshLatestLiputonInfo = async (data: ILiputonResult, channel?: any) => {
    const item = await getLiputonStoredInfo(data.id);

    if (!data || !data.id)
        return;

    if (!item) {
        await setStoredTicket(data);
        return;
    }

    const { tickets: lastTickets } = item;

    if (LiputonUtils.areSame(lastTickets.map(x => x.id), data.tickets.map(x => x.id)))
        return;

    const ticketDiff = LiputonUtils.getTicketDifference(lastTickets, data.tickets);

    await setStoredTicket(data);

    if (channel) {
        let msgOutput =
            `__Lippumuutoksia tapahtumassa ${data.event.name} (id: ${data.id})!__\r\n\r\n` +
            (ticketDiff.soldTickets.length > 0 ? `**POISTUNEET LIPUT**\r\n${LiputonUtils.renderTicketInfo(ticketDiff.soldTickets)}` : "") +
            (ticketDiff.newTickets.length > 0 ? `**UUSIA LIPPUJA**\r\n${LiputonUtils.renderTicketInfo(ticketDiff.newTickets)}` : "\r\n");

        const hl = await getEventLiputonHighlight(data.id);

        if (hl && hl.length > 0) {
            let hlOutput = "";
            hl.forEach((x, i) => {
                hlOutput = i === 0 ? x : " " + x;
            });
            msgOutput = `${msgOutput}\r\n**HUOM! ${hlOutput}**`;
        }

        msgOutput = msgOutput + `${rn(2)}__https://liputon.fi/events/${data.id}__`;

        channel.send(msgOutput);
    }
};

const getActiveLiputonTrackings = async (): Promise<string[]> => {
    const active = await fs.readJson(`${storeFilePathBase}active.json`)
        .then((x: { active: string[]; }) => {
            if (x.active && x.active.length > 0)
                return x.active;

            return null;
        }, () => null);

    return active ? active : [];
};

// Ajastimet

const setLiputonTimers = async (channel: any) => {
    const time = 60 * 1000 * 5; // 5 min
    const active = await getActiveLiputonTrackings();

    if (!active) return;

    active.forEach(x => setInterval(async () => await refreshLiputonItem(x, channel), time));
};

module.exports = {
    setLiputonTimers,
    getActiveLiputonTrackings,
    refreshAllLiputonItems,
    getLiputonStoredInfo,
    fetchLiputonInfo,
    fetchLiputonInfoString
};
