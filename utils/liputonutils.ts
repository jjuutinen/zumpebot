import { ILiputonResultPlain, ILiputonResult, ILiputonTicket } from "../src/liputon";
import { rn, distinct } from "./commonutils";

export class LiputonUtils {
    static renderPrice = (value: number) => {
        return `${(value / 100).toFixed(2)} €`;
    };

    static getTicketDifference = (oldList: ILiputonTicket[], resList: ILiputonTicket[]) => {
        const newTickets = resList.filter(x => oldList.every(t => t.id !== x.id));
        const soldTickets = oldList.filter(x => resList.every(t => t.id !== x.id));

        return { newTickets, soldTickets } as ITicketDiffer;
    };

    static areSame = (oldList: number[], resList: number[]) => {
        if (oldList.length === resList.length) {
            oldList.sort();
            resList.sort();

            for (let i = 0; i < oldList.length; i++) {
                if (oldList[i] === resList[i]) continue;
                return false;
            }
            return true;
        }
        return false;
    };

    static renderTicketInfo = (tickets: ILiputonTicket[]) => {
        if (!tickets || tickets.length === 0)
            return "";

        let output = "\r\n";

        const groups = distinct(tickets.map(x => x.name));

        groups.forEach((g, index) => {
            output = output + g;
            const gTickets = tickets.filter(x => x.name === g);

            if (!gTickets || gTickets.length <= 0) return;

            const priceValues = gTickets.map(x => x.price);

            output = output + ` - ${gTickets.length} kpl - Alin hinta: ${LiputonUtils.renderPrice(Math.min(...priceValues))} - ` +
                `Alkup. hinta ${LiputonUtils.renderPrice(gTickets[0].orig_price)}\r\n`;

        });

        return output;
    };

    static mapLiputonResultObject = (id: string, result: ILiputonResultPlain): ILiputonResult => {
        return {
            id: id,
            event: {
                image: result.event.image ?? "",
                name: result.event.name ?? "",
                ticket_amount: result.event.ticket_amount ?? 0
            },
            tickets: result.tickets.map(t => ({
                id: t.id,
                name: t.name,
                orig_price: t.original_price,
                price: t.price
            } as ILiputonTicket))
        } as ILiputonResult;
    };
}

interface ITicketDiffer {
    soldTickets: ILiputonTicket[];
    newTickets: ILiputonTicket[];
}