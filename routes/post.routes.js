const Router = require('express')
const { validationResult } = require('express-validator')
const router = new Router()
const Recomendation = require('../models/Recomendation')
const Comment = require('../models/Comment')
const multer = require('multer')
const path = require('path')
const cloudinary = require('../helpers/uploadImageHelper')

// muler storage
const storage = multer.diskStorage({
	filename: function (req, file, cb) {
		cb(null, Date.now() + '-' + file.originalname)
	},
})

const upload = multer({
	storage: storage,
}).single('testImage')

// posts routes
router.post(
	'/post',

	async (req, res) => {
		try {
			upload(req, res, async (err) => {
				if (err) {
					console.log(err)
					res.send({ message: 'Server error' })
				} else {
					const errors = validationResult(req)
					if (!errors.isEmpty()) {
						return res
							.status(400)
							.json({ message: 'Uncorrect request', errors })
					}
					const {
						sender,
						name,
						number,
						title,
						status,
						type,
						rooms,
						square,
						location,
						price,
						content,
					} = req.body

					const result = await cloudinary.uploader.upload(
						req.file.path,
						{
							public_id: `${req.file.filename}__${sender}`,
							crop: 'fill',
						}
					)

					let objLoc = JSON.parse(location)

					const message = new Recomendation({
						sender,
						name,
						number,
						title,
						status,
						type,
						rooms,
						square,
						location: {
							longitude: objLoc.longitude,
							latitude: objLoc.latitude,
						},
						price,
						content,
						image: result.url,
						moderated: false,
						validation: 'under review',
					})
					message
						.save()
						.then(() => res.json({ message: 'Message sent' }))
						.catch((err) => console.log(err))
				}
			})
		} catch (error) {
			console.log(error)
			res.send({ message: 'Server error' })
		}
	}
)

router.get('/images/:image', async (req, res) => {
	try {
		res.sendFile(path.join(path.resolve(), 'uploads', req.params.image))
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

router.get('/allposts', async (req, res) => {
	try {
		const recomendation = await Recomendation.find({})
		return res.json(recomendation)
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

router.get('/allactiveposts', async (req, res) => {
	try {
		const recomendation = await Recomendation.find({ moderated: true })
		return res.json(recomendation)
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

router.get('/allnotactiveposts', async (req, res) => {
	try {
		const recomendation = await Recomendation.find({
			validation: 'under review',
		})
		return res.json(recomendation)
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

router.delete(`/deletepost/:id`, async (req, res) => {
	try {
		const post = await Recomendation.findOne({ _id: req.params.id })
		const coment = await Comment.findOne({ postId: req.params.id })
		post.delete()
		coment.delete()
		return res.status(204).json({})
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

router.patch(`/post/:id`, async (req, res) => {
	try {
		const post = await Recomendation.findOne({ _id: req.params.id })
		const { title, status, type, rooms, square, price, content } = req.body

		post.title = title
		post.status = status
		post.content = content
		post.type = type
		post.rooms = rooms
		post.square = square

		post.price = price
		post.moderated = false
		post.validation = 'under review'
		post.save()
		return res.status(204).json({})
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

router.patch(`/likepost/:id`, async (req, res) => {
	try {
		const post = await Recomendation.findOne({ _id: req.params.id })
		const { username } = req.body
		if (post.likes.includes(username)) {
			post.likes = post.likes.filter((e) => e !== username)
			post.save()
			return res.status(204).json({ message: 'disliked' })
		}
		post.likes.push(username)
		post.save()
		return res.status(204).json({ message: 'liked' })
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

router.get(`/getonepost/:postid`, async (req, res) => {
	try {
		const post = await Recomendation.findOne({ _id: req.params.postid })
		return res.json(post)
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

router.get(`/getpostsfrom/:sender`, async (req, res) => {
	try {
		const post = await Recomendation.find({ sender: req.params.sender })
		return res.json(post)
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

router.get(`/getactivepostsfrom/:sender`, async (req, res) => {
	try {
		const post = await Recomendation.find({
			sender: req.params.sender,
			moderated: true,
		})
		return res.json(post)
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

router.get(`/getreviewpostsfrom/:sender`, async (req, res) => {
	try {
		const post = await Recomendation.find({
			sender: req.params.sender,
			moderated: false,
		})
		return res.json(post)
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

router.patch(`/acceptpostfrom/:id`, async (req, res) => {
	try {
		const post = await Recomendation.findOne({ _id: req.params.id })
		post.moderated = post.moderated == true ? false : true
		post.validation = 'accepted'
		post.save()
			.then(() => res.json({ message: 'Message sent', post: post }))
			.catch((err) => console.log(err))
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

router.patch(`/denypostfrom/:id`, async (req, res) => {
	try {
		const post = await Recomendation.findOne({ _id: req.params.id })
		post.moderated = false
		post.validation = 'denied'
		post.save()
			.then(() => res.json({ message: 'Message sent', post: post }))
			.catch((err) => console.log(err))
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

module.exports = router
