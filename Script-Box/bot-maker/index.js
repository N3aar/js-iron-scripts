const loadBots = () => {
	const load = GlobalStorage.get(`bots-${Room.getId()}`)

	if (!load) {
		return {}
	}

	return JSON.parse(load)
}

const bots = loadBots()
const prefix = '/'
const rank = 9
const regex_question = /\[(.*)\]\((.*)\)/
const botNames = []

const modes = {
	aleatorio: 'random',
	ordem: 'order'
}

// Utils
const timerWait = (callback, ticks) => {
	const delay = Delay.interval(() => {
		Delay.cancel(delay)
		callback()
	}, ticks)

	return delay
}

const BotCommand = (command, start, exists, callback) => {
	const execute = (entity, message) => {
		if (entity.hasRank(rank)) {
			const args = message.split(' ').slice(1)
			const name = args.shift()

			if (!name) {
				return entity.message('Digite o nome do Bot junto ao comando!')
			}

			if (exists && !bots[name]) {
				return entity.message('Não foi criado um Bot com este nome!')
			}

			const bot = exists ? bots[name] : name
			callback(entity, bot, args)
		}
	}

	Commands.register(`${prefix}${command}`, start, execute)
}

const removeNameInList = name => {
	const index = botNames.indexOf(name)
	botNames.splice(index, 1)
}

// Loading
const clearBots = names => {
	const deleting = name => {
		delete bots[name].entity
		delete bots[name].delay
	}
	names.forEach(deleting)
}

const createLoadedBots = () => {
	const names = Object.keys(bots)

	for (const name of names) {
		const bot = bots[name]
		bot.entity = createNewBot(bot)
		botNames.push(bot.name)
		updateDelay(bot)
	}
}

const saveBots = () => {
	const names = Object.keys(bots)

	if (names.length) {
		clearBots(names)
	}

	const save = JSON.stringify(bots)
	GlobalStorage.set(`bots-${Room.getId()}`, save)
}

// Bot
const createNewBot = config => {
	const bot = Faker.createFakePlayer(config.name, config.x, config.y, config.z, 0)

	if (config.r) {
		bot.teleport(config.x, config.y, config.z, config.r)
	}
	
	if (config.figure) {
		bot.setFigure(config.gender, config.figure)
	}

	if (config.badges) {
		for (const badge of config.badges) {
			bot.addBadge(badge)
		}
	}

	if (config.motto) {
		bot.setMotto(config.motto)
	}

	if (config.dance) {
		bot.setDance(config.dance)
	}

	if (config.handitem) {
		bot.setHandItem(config.handitem)
	}

	if (config.effect) {
		bot.setEffect(config.effect)
	}

	if (config.state === 'sit') {
		bot.sit()
	}

	if (config.state === 'lay') {
		bot.lay()
	}

	return bot
}

const getAllProperties = entity => {
	const x = entity.getX()
	const y = entity.getY()
	const z = entity.getZ()
	const r = entity.getR()
	const gender = entity.getGender()
	const figure = entity.getFigure()
	const motto = entity.getMotto()
	const dance = entity.getDance()
	const handitem = entity.getHandItem()
	const effect = entity.getEffect()
	
	return { x, y, z, r, gender, figure, motto, dance, handitem, effect }
}

const botReset = bot => {
	bot.messages = []
	bot.questions = []
	bot.badges = []
	bot.mode = 'order'
	bot.timer = null
	bot.bubble = 1
	bot.order = 0
}

const create = (entity, name) => {
	if (name in bots) {
		return entity.message('Já foi criado um bot anterior com este nome!')
	}

	const config = getAllProperties(entity)

	config.name = name

	const bot = createNewBot(config)
	
	config.entity = bot

	botReset(config)

	bots[name] = config

	botNames.push(name)
	
	entity.message('Bot criado com sucesso!')
}

const deleteBot = (entity, bot) => {
	Faker.removeEntity(bot.entity)

	if (bot.delay) {
		Delay.cancel(bot.delay)
	}

	delete bots[bot.name]

	removeNameInList(bot.name)

	entity.message('Bot deletado com sucesso!')
}

const copyBot = (entity, name, args) => {
	const newName = args[0]

	if (!newName) {
		return entity.message('Digite o nome do novo Bot junto ao comando!')
	}

	bots[newName] = Object.assign({}, bots[name])

	const newBot = bots[newName]

	newBot.name = newName
	newBot.x = entity.getX()
	newBot.y = entity.getY()
	newBot.z = entity.getZ()
	newBot.r = entity.getR()

	const bot = createNewBot(newBot)

	newBot.entity = bot

	botReset(newBot)

	botNames.push(newName)

	entity.message('Bot copiado com sucesso!')
}

const setPosition = (entity, bot) => {
	const x = entity.getX()
	const y = entity.getY()
	const z = entity.getZ()
	const r = entity.getR()

	bot.x = x
	bot.y = y
	bot.z = z
	bot.r = r
	bot.entity.teleport(x, y, z, r)
	
	entity.message('Bot se moveu para posição com sucesso!')
}

const setFigure = (entity, bot) => {
	const gender = entity.getGender()
	const figure = entity.getFigure()
	
	bot.gender = gender
	bot.figure = figure
	bot.entity.setFigure(gender, figure)
	
	entity.message('Visual definido com sucesso!')
}

const setMotto = (entity, bot, args) => {
	const motto = args.join(' ')

	bot.motto = motto
	bot.entity.setMotto(motto)

	entity.message('Missão definida com sucesso!')
}

const setEffect = (entity, bot, args) => {
	const effect = Number(args[0]) || entity.getEffect()
	
	bot.effect = effect
	bot.entity.setEffect(effect)

	entity.message('Efeito adicionado com sucesso!')
}

const setHanditem = (entity, bot, args) => {
	const handitem = Number(args[0]) || entity.getHandItem()
	
	bot.handitem = handitem
	bot.entity.setHandItem(handitem)

	entity.message('Handitem adicionado com sucesso!')
}

const setDance = (entity, bot, args) => {
	const dance = Number(args[0]) || entity.getDance()

	bot.dance = dance
	bot.entity.setDance(dance)
	
	entity.message('Dança definida com sucesso!')
}

const addBadgeOfBot = (entity, bot, args) => {
	const code = args[0]

	if (!code) {
		return entity.message('Digite corretamente o código do Emblema!')
	}

	if (bot.badges.length >= 5) {
		return entity.message('Este bot já atingiu o limite de emblemas!')
	}

	bot.entity.addBadge(code)
	bot.badges.push(code)

	entity.message('Emblema adicionado com sucesso!')
}

const listBotBadges = (entity, bot) => {
	const badges = bot.badges

	if (!badges || !badges.length) {
		return entity.message('Não há emblemas neste bot')
	}

	const text = badges.join(', ')

	entity.message(`Emblemas: ${text}`)
}

const removeBadgeOfBot = (entity, bot, args) => {
	const code = args[0]
	const index = bot.badges.indexOf(code)

	if (!code) {
		return entity.message('Digite corretamente o código do Emblema!')
	}

	if (index < 0) {
		return entity.message('Este emblema não foi adicionado ao bot!')
	}

	bot.entity.removeBadge(code)
	bot.badges.splice(index, 1)

	entity.message('Emblema removido com sucesso!')
}

const sit = (entity, bot) => {
	bot.entity.sit()

	bot.state = 'sit'

	entity.message('Bot sentado com sucesso!')
}

const lay = (entity, bot) => {
	bot.entity.lay()

	bot.state = 'lay'

	entity.message('Bot deitado com sucesso!')
}

const stand = (entity, bot) => {
	bot.entity.std()
	bot.state = null
	entity.message('Bot levantado com sucesso!')
}

// Placeholders
const parseNumber = number => ('0' + number).slice(-2)

const getDate = () => {
	const date = new Date()
	date.setHours(date.getHours() - 3)
	return date
}

const getFullDate = () => {
	const date = getDate()
	const day = parseNumber(date.getDate())
	const month = parseNumber(date.getMonth())
	const year = date.getFullYear() - 2000
	return `${day}/${month}/${year}`
}

const placeholders = [
	{
		match: 'bot',
		replacer: bot => bot.name 
	},
	{ 
		match: 'room',
		replacer: () => Room.getName()
	},
	{
		match: 'owner',
		replacer: () => Room.getOwnerUsername()
	},
	{ 
		match: 'users',
		replacer: () => parseNumber(Room.userCount())
	},
	{ 
		match: 'hour',
		replacer: () => parseNumber(getDate().getHours() )
	},
	{ 
		match: 'min',
		replacer: () => parseNumber(getDate().getMinutes())
	},
	{ 
		match: 'seconds',
		replacer: () => parseNumber(getDate().getSeconds())
	},
	{ 
		match: 'day',
		replacer: () => parseNumber(getDate().getDate())
	},
	{
		match: 'month',
		replacer: () => parseNumber(getDate().getMonth() + 1)
	},
	{ 
		match: 'year',
		replacer: () => getDate().getFullYear()
	},
	{ 
		match: 'full',
		replacer: () => getFullDate()
	}
]

// Bot messages
const botSay = (bot, message) => {
	const matching = ph => message.includes(`{${ph.match}}`)
	const reducer = (acc, ph) => acc.replace(`{${ph.match}}`, ph.replacer(bot))

	const matchs = placeholders.filter(matching)
	const text = matchs.reduce(reducer, message)

	bot.entity.say(text, false, bot.bubble)
}

const getRandomMessage = bot => bot.messages[Math.floor(Math.random() * bot.messages.length)]

const getRandomTime = time => {
	const min = Math.min(time[0], time[1])
	const max = Math.max(time[0], time[1])
	return Math.floor(Math.random() * (max - min + 1)) + min
}

const accInMessageOrder = bot => {
	bot.order++

	if (bot.order >= bot.messages.length) {
		bot.order = 0
	}
}

const updateDelay = bot => {
	if (bot.delay) {
		Delay.cancel(bot.delay)
	}

	const send = () => sendMessage(bot)
	const random = Array.isArray(bot.time)
	const seconds = random ? getRandomTime(bot.time) : bot.time
	const ticks = Delay.seconds(seconds)

	const interval = () => {
		bot.delay = null
		send()
		updateDelay(bot)
	}

	bot.delay = random ? timerWait(interval, ticks) : Delay.interval(send, ticks)
}

const sendMessage = bot => {
	if (!bot.messages.length) {
		return
	}

	const isRandomMode = bot.mode === 'random'
	const message = isRandomMode ? getRandomMessage(bot) : bot.messages[bot.order]

	botSay(bot, message)

	if (!isRandomMode) {
		accInMessageOrder(bot)
	}
}

const userQuestion = (entity, message) => {
	const botName = botNames.find(name => message.startsWith(`${name},`))

	if (!botName) {
		return
	}

	const bot = bots[botName]
	if (!bot) {
		return
	}

	const args = message.split(',')
	const text = args.slice(1).join(',').trim().toLowerCase()
	const question = bot.questions.find(qst => qst.question === text)


	if (!question) {
		return
	}

	const say = () => botSay(bot, question.answer)

	timerWait(say, 1)
}

const addMessage = (entity, bot, args) => {
	const text = args.join(' ')

	if (!text.length) {
		return entity.message('Digite a mensagem corretamente!')
	}

	bot.messages.push(text)

	entity.message('Mensagem adicionada com sucesso')
}

const addQuestion = (entity, bot, args) => {
	const text = args.join(' ')
	const messages = regex_question.exec(text)
	const qst = messages && messages[1]
	const question = qst?.trim().toLowerCase()
	const answer = messages && messages[2]

	if (!text.length || !question) {
		return entity.message('Digite a pergunta corretamente!')
	}

	if (!answer) {
		return entity.message('Digite a resposta corretamente!')
	}

	bot.questions.push({ question, answer })

	entity.message('Pergunta adicionada com sucesso')
}

const setTimer = (entity, bot, args) => {
	const arg = args[0]

	if (!arg) {
		return entity.message('Digite o tempo corretamente!')
	}

	const isRelative = arg.includes('-')
	const time = isRelative ? arg.split('-').map(n => Number(n)) : Number(arg)
	const invalidArray = isRelative && (time[0] < 0.5 || time[1] < 0.5)

	if (invalidArray || time < 0.5) {
		return entity.message('Digite um valor válido! Minimo: 0.5 segundos!')
	}

	bot.time = time
	updateDelay(bot)

	entity.message('Tempo definido com sucesso')
}

const setMode = (entity, bot, args) => {
	const mode = args[0]
	const parse = modes[mode]

	if (!parse) {
		return entity.message('Digite um modo válido!')
	}

	bot.mode = parse

	entity.message('Modo definido com sucesso')
}

const setBubble = (entity, bot, args) => {
	const bubble = Number(args[0])

	if (!bubble || bubble < 1 || bubble > 38) {
		return entity.message('Digite um número válido do balão de fala!')
	}

	bot.bubble = bubble

	entity.message('Modo definido com sucesso')
}

const displayMessages = (entity, bot) => {
	const messages = bot.messages

	if (!messages || !messages.length) {
		return entity.message('Não há mensagens neste bot')
	}

	const mapp = messages.map((msg, i) => `${i}: ${msg}`)
	
	for (const message of mapp) {
		entity.message(message)
	}
}

const displayQuestions = (entity, bot) => {
	const questions = bot.questions

	if (!questions || !questions.length) {
		return entity.message('Não há perguntas neste bot')
	}

	const mapp = questions.map((qst, i) => `${i}: P[${qst.question}] R(${qst.answer})`)

	for (const question of mapp) {
		entity.message(question)
	}
}

const options = {
	messages: 'Mensagem',
	questions: 'Pergunta'
}

const remove = (entity, bot, args, key) => {
	const index = Number(args[0])
	const option = options[key]

	if (isNaN(index) || index < 0 || index >= bot[key].length) {
		return entity.message(`Digite um número valido da ${option}! Use: ${prefix}mensagens.`)
	}

	bot.messages.splice(index, 1)

	entity.message(`${option} removida com sucesso!`)
}

const removeMessage = (entity, bot, args) => remove(entity, bot, args, 'messages')
const removeQuestion = (entity, bot, args) => remove(entity, bot, args, 'questions')

// Commands
BotCommand('criar', true, false, create)
BotCommand('copiar', true, false, copyBot)
BotCommand('delete', true, true, deleteBot)

BotCommand('posicao', true, true, setPosition)
BotCommand('visual', true, true, setFigure)
BotCommand('missao', true, true, setMotto)
BotCommand('efeito', true, true, setEffect)
BotCommand('handitem', true, true, setHanditem)
BotCommand('danca', true, true, setDance)
BotCommand('emblema', true, true, addBadgeOfBot)
BotCommand('listb', true, true, listBotBadges)
BotCommand('remblema', true, true, removeBadgeOfBot)
BotCommand('sentar', true, true, sit)
BotCommand('deitar', true, true, lay)
BotCommand('levantar', true, true, stand)

BotCommand('mensagem', true, true, addMessage)
BotCommand('pergunta', true, true, addQuestion)
BotCommand('listm', true, true, displayMessages)
BotCommand('listp', true, true, displayQuestions)
BotCommand('rmensagem', true, true, removeMessage)
BotCommand('rpergunta', true, true, removeQuestion)

BotCommand('tempo', true, true, setTimer)
BotCommand('modo', true, true, setMode)
BotCommand('balao', true, true, setBubble)

// Events
Events.on('load', createLoadedBots)
Events.on('dispose', saveBots)
Events.on('say', userQuestion)
