const CryptoJS = require('crypto-js');
const axios = require('axios').default;
const moment = require('moment');
const qs = require('qs');
const User = require('../models/User');
const { io } = require('../../../server');
require('dotenv').config();

exports.createPayment = (req, res) => {
	const { userID, amount, socketID } = req.body;
	const embed_data = {};
	const items = [
		{
			userID,
			socketID,
		},
	];
	const transID = Math.floor(Math.random() * 1000000);
	const order = {
		app_id: process.env.ZALO_PAY_APP_ID,
		app_trans_id: `${moment().format('YYMMDD')}_${transID}`, // translation missing: vi.docs.shared.sample_code.comments.app_trans_id
		app_user: 'Kmovie',
		app_time: Date.now(), // miliseconds
		item: JSON.stringify(items),
		embed_data: JSON.stringify(embed_data),
		amount,
		description: `Payment for Kmovie #${transID}`,
		callback_url: `${process.env.NGROK_SERVER}/api/payment/return-payment`,
	};
	const data =
		order.app_id +
		'|' +
		order.app_trans_id +
		'|' +
		order.app_user +
		'|' +
		order.amount +
		'|' +
		order.app_time +
		'|' +
		order.embed_data +
		'|' +
		order.item;
	order.mac = CryptoJS.HmacSHA256(data, process.env.ZALO_PAY_KEY_1).toString();
	axios
		.post(process.env.ZALO_PAY_URL_CREATE, null, { params: order })
		.then((result) => {
			console.log(result.data);
			return res.status(200).json(result.data);
		})
		.catch((err) => console.log(err));
};

exports.returnPayment = (req, res) => {
	let result = {};
	try {
		let dataStr = req.body.data;
		let reqMac = req.body.mac;

		let mac = CryptoJS.HmacSHA256(dataStr, process.env.ZALO_PAY_KEY_2).toString();
		console.log('mac =', mac);

		// kiểm tra callback hợp lệ (đến từ ZaloPay server)
		if (reqMac !== mac) {
			// callback không hợp lệ
			result.return_code = -1;
			result.return_message = 'mac not equal';
		} else {
			// thanh toán thành công
			// merchant cập nhật trạng thái cho đơn hàng
			let dataJson = JSON.parse(dataStr, process.env.ZALO_PAY_KEY_2);
			axios
				.post(`${process.env.NGROK_SERVER}/api/payment/result-payment`, {
					app_trans_id: dataJson['app_trans_id'],
					item: JSON.parse(dataJson['item']),
				})
				.then((res) => {
					console.log('receive result', res.data);
				})
				.catch((err) => console.log(err));

			result.return_code = 1;
			result.return_message = 'success';
		}
	} catch (ex) {
		result.return_code = 0; // ZaloPay server sẽ callback lại (tối đa 3 lần)
		result.return_message = ex.message;
	}

	// thông báo kết quả cho ZaloPay server
	res.json(result);
};

exports.resultPayment = (req, res) => {
	const { app_trans_id, item } = req.body;
	console.log(item);
	let postData = {
		app_id: process.env.ZALO_PAY_APP_ID,
		app_trans_id, // Input your app_trans_id
	};

	let data = postData.app_id + '|' + postData.app_trans_id + '|' + process.env.ZALO_PAY_KEY_1; // appid|app_trans_id|key1
	postData.mac = CryptoJS.HmacSHA256(data, process.env.ZALO_PAY_KEY_1).toString();
	let postConfig = {
		method: 'post',
		url: process.env.ZALO_PAY_URL_QUERY,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		data: qs.stringify(postData),
	};

	axios(postConfig)
		.then(function (response) {
			// success response
			if (response.data.return_code === 1) {
				let balance;
				switch (response.data.amount) {
					case 129000: {
						balance = 30;
						break;
					}
					case 249000: {
						balance = 68;
						break;
					}
					case 379000: {
						balance = 98;
						break;
					}
					case 779000: {
						balance = 198;
						break;
					}
					case 1299000: {
						balance = 328;
						break;
					}
					case 2499000: {
						balance = 648;
						break;
					}
					case 7999000: {
						balance = 1998;
						break;
					}
					case 21999000: {
						balance = 6248;
						break;
					}
					default: {
						balance = 6;
					}
				}
				User.findOne({ _id: item[0].userID })
					.then(async (user) => {
						if (user) {
							user.balance += balance;
							await user
								.save()
								.then((updated) => {
									console.log('update balance');
								})
								.catch((err) => {
									throw err;
								});
						}
					})
					.catch((err) => {
						throw err;
					});
			}
			io.to(item[0].socketID).emit('return-page');
		})
		.catch(function (error) {
			console.log(error);
		});
};
