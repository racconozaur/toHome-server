const Router = require('express')
const User = require('../models/User')
const bcrypt = require('bcryptjs')
const config = require('config')
const jwt = require('jsonwebtoken')
const { check, validationResult } = require('express-validator')
const router = new Router()
const authMiddleware = require('../middleware/auth.middleware')
const Recomendation = require('../models/Recomendation')
const Comment = require('../models/Comment')
const multer = require('multer')
const path = require('path')
const cloudinary = require('../helpers/uploadImageHelper')

router.post(
	'/registration',
	[
		check('email', 'Uncorrect email').isEmail(),
		check(
			'password',
			'Password must be longer than 3 and shorter than 12'
		).isLength({ min: 3, max: 12 }),
	],
	async (req, res) => {
		try {
			const errors = validationResult(req)
			if (!errors.isEmpty()) {
				return res
					.status(400)
					.json({ message: 'Uncorrect request', errors })
			}
			const { email, password, number, name } = req.body
			const candidate = await User.findOne({ email })
			if (candidate) {
				return res
					.status(400)
					.json({ message: `User with email ${email} already exist` })
			}
			const hashPassword = await bcrypt.hash(password, 8)
			let currentDate = new Date().toJSON().slice(0, 10)

			const user = new User({
				email,
				password: hashPassword,
				date: currentDate,
				number,
				name,
				status: 'active',
				role: 'user',
			})
			await user.save()
			res.json({ message: 'User was created' })
		} catch (e) {
			console.log(e)
			res.send({ message: 'Server error' })
		}
	}
)

router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body
		const user = await User.findOne({ email })
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}
		const isPassValid = bcrypt.compareSync(password, user.password)
		if (!isPassValid) {
			return res.status(400).json({ message: 'Invalid password' })
		}
		const token = jwt.sign({ id: user.id }, config.get('secretKey'), {
			expiresIn: '1h',
		})
		return res.json({
			token,
			user: {
				id: user.id,
				email: user.email,
				date: user.date,
				status: user.status,
				role: user.role,
			},
		})
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

router.get('/auth', authMiddleware, async (req, res) => {
	try {
		const user = await User.findOne({ _id: req.user.id })
		const token = jwt.sign({ id: user.id }, config.get('secretKey'), {
			expiresIn: '1h',
		})
		return res.json({
			token,
			user: {
				id: user.id,
				email: user.email,
				date: user.date,
				status: user.status,
			},
		})
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

router.get('/allusers', async (req, res) => {
	try {
		const user = await User.find({}, { password: 0 })
		return res.json(user)
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

router.delete(`/delete/:id`, async (req, res) => {
	try {
		const user = await User.findOne({ _id: req.params.id })
		user.delete()
		return res.status(204).json({})
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

router.patch(`/user/:id`, async (req, res) => {
	try {
		const user = await User.findOne({ _id: req.params.id })
		user.status = user.status == 'active' ? 'blocked' : 'active'
		user.save()
		return res.status(204).json({})
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

router.patch(`/userrole/:id`, async (req, res) => {
	try {
		const user = await User.findOne({ _id: req.params.id })
		user.role = user.role == 'user' ? 'admin' : 'user'
		user.save()
		return res.status(204).json({})
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

router.get(`/getoneuser/:email`, async (req, res) => {
	try {
		const user = await User.findOne({ email: req.params.email })
		return res.json(user)
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

// posts

// muler storage

const storage = multer.diskStorage({
	// destination: 'uploads',
	filename: function (req, file, cb) {
		cb(null, Date.now() + '-' + file.originalname)
	},
})

const upload = multer({
	storage: storage,
}).single('testImage')

//
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
		const { title, status, type, rooms, square, price, content } =
			req.body

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

// router.patch(`/dislikepost/:id`,
//     async (req, res) => {
//         try {
//             const post  = await Recomendation.findOne({"_id": req.params.id})
//             const {username} = req.body
//             // post.likes.pop(username)
//             post.likes = post.likes.filter((e) => e !== username)
//             post.save()
//             return res.status(204).json({})
//         } catch (e) {
//             console.log(e)
//             res.send({message: "Server error"})
//         }

// })

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
		return res.status(204).json({})
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
		return res.status(204).json({})
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

// router.get(`/notmoderatedposts`,
//     async (req, res) => {
//         try {
//             const post = await Recomendation.find({"moderated": false})
//             return res.json(post)
//         } catch (e) {
//             console.log(e)
//             res.send({message: "Server error"})
//         }

//     })

// comment

router.post(
	'/comment',

	async (req, res) => {
		try {
			const errors = validationResult(req)
			if (!errors.isEmpty()) {
				return res
					.status(400)
					.json({ message: 'Uncorrect request', errors })
			}
			const { postId, comment, author } = req.body

			const newComment = new Comment({ postId, comment, author })
			await newComment.save()
			res.json({ message: 'Message sent' })
		} catch (e) {
			console.log(e)
			res.send({ message: 'Server error' })
		}
	}
)

router.get('/allcomments', async (req, res) => {
	try {
		const comment = await Comment.find({})
		return res.json(comment)
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

router.get(`/getcommentsfrom/:postId`, async (req, res) => {
	try {
		const post = await Comment.find({ postId: req.params.postId })
		return res.json(post)
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

module.exports = router