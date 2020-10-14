const winston = require("winston");
const path = require("path");

const log = winston.createLogger({
	format: winston.format.combine(
		winston.format.timestamp({
			format: 'YYYY/MM/DD HH:mm:ss'
		}),
		winston.format.json(),
		winston.format.printf((log) => {
			return `${JSON.stringify({
				timestamp: log.timestamp,
				level: log.level,
				message: log.message
			}, null, 4)}`;
		})
	),
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({filename: path.join(__dirname, "../# log.log")})
	]
});

module.exports.log = log;
