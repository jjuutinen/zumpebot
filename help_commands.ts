import { Message } from "discord.js";

const { commandDict } = require('./commands');


const executeHelpCommand = (props: Message<boolean>) => {
    const split = props.content.includes(" ") ? props.content.split(" ") : [];
    let params = [];

    if (split.length > 0) {
        split.shift();
        params = split;

        if (params[0].substring(0, 1) === "!" || params[0].substring(0, 1) === '-')
            params[0] = params[0].substring(1);
    }

    let output = "";

    const allCommands = Object.values(commandDict).flat();

    if (!params || params.length <= 0) {
        output = "Käytä komentoa näin: !help <komennon nimi>. Esim: !help !liputon\r\n" +
            "Komennot: !liputon, !liputonhl, !sää, !created";

        props.channel.send(output);

        return;
    }

    else if (params && params.length > 0 && !allCommands.includes(params[0]))
        output = `En tunne komentoa: ${params[0]}.`;


    else if (commandDict['liputon'].includes(params[0])) {
        output =
            "**!liputon / !lip / !lippu [id]**\r\n" +
            "Ilman parametriä kertoo, mitkä Liputon.fi -tapahtumat on hakuvahdissa, lippumuutoksista annetaan ilmoitus #zumpebot-kanavalle\r\n" +
            "Mikäli komennossa on Id-parametri (esim: !lip 91926), näytetään viimeisimmät päivitetyt lipputiedot tapahtumasta.";
    }

    else if (commandDict['liputonhl'].includes(params[0])) {
        output = "**!liphl [add|rem] [id]**\r\n" +
            "Näyttää sinulle aktiiviset Liputon.fi-hakuvahdit id:n perusteella. Lisäys: !liphl add <id>, poisto: !liphl rem <id>.\r\n Esim: !liphl add 91926";
    }

    else if (commandDict['forecast'].includes(params[0])) {
        output = "**!weather / !w / !sää / !saa <hakusana>**\r\nHakee hakusanalla kohteen säätiedot.";
    }

    else if (commandDict['created'].includes(params[0])) {
        output = "**!created**\r\nKertoo milloin kanava ja palvelin on luotu.";
    }

    if (output != "")
        props.channel.send(output);

};



module.exports = { executeHelpCommand };