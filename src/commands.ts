import { Message } from "discord.js";
import { LiputonUtils } from "../utils/liputonutils";

const getWeatherForecast = require('./weather.ts');
const {
  setLiputonTimers,
  getActiveLiputonTrackings,
  fetchLiputonInfo,
  fetchLiputonInfoString,
  refreshAllLiputonItems
} = require('./liputon.ts');

const { addLiputonHighlight, removeLiputonHighlight, getUserLiputonHighlight } = require('./liputon_highlight.ts');

const makeTimestamp = (command: string, params: string[], user: string) => {
  const d = new Date();
  const timeStamp = `${d.toLocaleTimeString()}`;
  let log = `[${timeStamp}][${user} executed command: ${command}]`;

  if (params && params.length > 0)
    log += `[params: ${params.join(" ")}]`;

  console.log(log);
};

const parseCommand = (command: string) => {
  const cmd = command.toLowerCase();
  if (cmd.includes(" ")) return cmd.substring(0, cmd.indexOf(" "));

  return cmd;
};

const executeCommand = async (props: Message<boolean>, prefix: "!" | "-") => {
  const command = parseCommand(props.content.substring(1));
  const commands: string[] = Object.values(commandDict).flat();
  const params: string[] = [];

  if (!commands.includes(command)) return;

  const fullParams = props.content.indexOf(" ") > -1 ? props.content.substring(props.content.indexOf(" ")).trim() : undefined;

  if (fullParams && fullParams.length > 0)
    fullParams.split(" ").forEach(x => params.push(x));

  makeTimestamp(command, params, props.author.username);

  if (commandDict['created'].includes(command)) {
    const chanCreated = props.channel.createdAt.toLocaleDateString() + " " + props.channel.createdAt.toLocaleTimeString();
    const serverCreated = props.guild.createdAt.toLocaleDateString() + " " + props.guild.createdAt.toLocaleTimeString();

    props.channel.send(`**Channel**: ${chanCreated} - **Server**: ${serverCreated}`);
  }

  if (commandDict['shutdown'].includes(command)) {
    props.client.destroy();
  }

  if (commandDict['liputon'].includes(command)) {
    if (params[0] === "refresh") {
      await refreshAllLiputonItems(props.channel);
      console.log(`Refreshed liputon tracking, executed by ${props.author.toString()}`);
    }
    else {
      const result = await execLiputonCommand(params);
      props.channel.send(result);
    }
  }

  if (commandDict['forecast'].includes(command)) {
    var output = await execWeatherCommand(params);
    props.channel.send(output);
  }

  if (commandDict['liputonhl'].includes(command)) {
    const user = props.author.toString();
    const result = await execLiputonHighlightCommand(params, user);

    if (result) props.channel.send(result);
  }
};

const execLiputonCommand = async (params): Promise<string> => {
  let output = "";

  if (params.length <= 0) {
    const active = await getActiveLiputonTrackings();

    if (!active || active.length <= 0)
      output = "Yhdenkään tapahtuman lippuseuranta ei ole aktiivisena.";

    let result = `Seuraavilla ID:illä on aktiivinen lippuseuranta: ${active.join(", ")}.`;

    return result;

  }

  else {
    let result;

    if ((!isNaN(parseInt(params[0])) || parseInt(params[0]) > 0) && params.length === 1) {
      result = await fetchLiputonInfo(params);

      if (!result) return (`Id:llä ${params[0]} ei löytynyt tietoja`);
    }
    else {
      if (params[0].length < 3) return ("LIPUTON: Tapahtuman haku epäonnistui, anna ainakin 3 merkkiä!");

      result = await fetchLiputonInfoString(params[0]);

      if (!result) return `Hakusanalla ${params.join(" ")} ei löytynyt tuloksia.`;
    }

    let output = "";

    if (result.tickets.length === 0)
      output = `Tapahtumalle ${result.event.name} ei löytynyt lippuja.`;
    else {
      output = `__**Tapahtuma: ${result.event.name} (ID: ${result.id})**__\r\n`;
      output = output + LiputonUtils.renderTicketInfo(result.tickets);
      output = output + `\r\nhttps://liputon.fi/events/${result.id}`;
    }

    return output;
  }
};

const execLiputonHighlightCommand = async (params: string[], user: string): Promise<string> => {
  if (params.length <= 0) {
    const ids = await getUserLiputonHighlight(user);

    return !ids || ids.length === 0 ? "Et ole yhdenkään Liputon-tapahtuman ilmoituslistalla." :
      `Sinulle tulee ilmoitus Liputon-lippumuutoksista ideillä: ${ids.join(", ")}`;
  }

  if (params[0].toLowerCase() === "add") {
    if (params.length <= 1) return ("Käytä komentoa näin: !liphl add <id>. Esim: !liphl add 91926");

    const id = params[1];
    const res = await addLiputonHighlight(user, id);
    const actives = await getActiveLiputonTrackings();

    if (res)
      return `LIPUTON: Sinulle ilmoitetaan, jos tapahtuu muutoksia tapahtumissa id:llä ${actives.join(", ")}`;

  }

  if (params[0].toLowerCase() === "del" || params[0].toLowerCase() === "rem") {
    if (params.length > 1) {
      const id = params[1];
      const res = await removeLiputonHighlight(user, id);

      if (res) return "LIPUTON: Et saa enää ilmoituksia tapahtumasta id:llä: " + id;
    }
    else {
      const res = await removeLiputonHighlight(user);
      if (res) return "LIPUTON: Sinua ei enää ilmoiteta minkään tapahtuman lippumuutoksista.";
    }
    return "";
  }
};

const execWeatherCommand = async (params: string[]): Promise<string> => {
  if (!params || params.length === 0 || params[0].length < 3) {
    return ("Anna hakukohde! Esim: !sää Kuopio");
  }

  const location = params.length > 1 ? params.join(" ") : params[0];

  const result = await getWeatherForecast(location);

  if (result != null) {
    const temperatureStr = result.weather.tempValue + result.weather.tempUnit;
    const rainStr = result.weather.rainValue + result.weather.rainUnit;
    const windStr = result.weather.windValue + result.weather.windUnit;
    const windHighestStr = result.weather.maxWindValue + result.weather.windUnit;
    const timeStamp = result.weather.time.toLocaleDateString() + " " + result.weather.time.toLocaleTimeString();

    const output = `__SÄÄ - ${result.location.name}__\r\n` +
      `__Lämpötila__: ${temperatureStr} (mitattu: ${timeStamp})\r\n` +
      `__Sateenmäärä__: ${rainStr} (vuorokauden aikana)\r\n` +
      `__Tuuli__: ${windStr} (vuorokauden keskiarvo), ${windHighestStr} (vuorokauden voimakkain)`;

    return output;
  }
  else {
    return "Säätietoja ei löytynyt hakusanalla: " + params.join(" ");
  }
};

const commandDict = {
  "created": ["created"],
  "shutdown": ["shutdown", "force_shutdown"],
  "forecast": ["saa", "sää", "forecast", "weather", "we"],
  "liputon": ["liputon", "lip", "lippu"],
  "liputonhl": ["liphl", "liputonhl"]
};

const saaDict = {
  "helsinki": ["hki"],
  "kuopio": ["kpo"],
  "turku": ["tku"],
  "tampere": ["tre"]
};

module.exports = { executeCommand, setLiputonTimers, commandDict };