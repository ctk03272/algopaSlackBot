const {RTMClient, WebClient} = require('@slack/client');
const request = require('request-promise');
const cheerio = require('cheerio');

const token = 'xoxb-522407326455-543259727331-CQSmXphLjIxmwTCocAY495IC';

// The client is initialized and then started to get an active connection to the platform
const rtm = new RTMClient(token);
rtm.start();

// Need a web client to find a channel where the app can post a message
const web = new WebClient(token);

let list = [];
let users = ['ctk0327', 'oyrin9595', 'ooiidd', 'klee', 'dragon4499', 'drcobi', 'fluxus', 'morot2'];
let scores = [0, 0, 0, 0, 0, 0, 0, 0];
let solved = {
    'ctk0327': [],
    'oyrin9595': [],
    'ooiidd': [],
    'klee': [],
    'dragon4499': [],
    'drcobi': [],
    'fluxus': [],
    'morot2': []
};

// let users = ['ctk0327']


// Load the current channels list asynchrously
web.channels.list()
    .then((res) => {
        // Take any channel for which the bot is a member
        const channel = res.channels.find(c => c.is_member && c.name === 'general');

        if (channel) {
            rtm.on('message', (message) => {

                if(message.text==="안내"){
                    let info="안녕하세요 알고파 봇입니다.\n" +
                        "이번주 문제를 입력하고 십으편 : 이번주 문제 (느낌표로 구분된 문제)\n" +
                        "현재 점수를 알고 싶으면  : 현재 점수\n" +
                        "이번주 풀이 현황을 알고 싶으면 : 이번주 풀이\n" +
                        "이번주 점수를 정산하고 싶으면 : 점수 정산\n" +
                        "이번달 현재 점수를 알고 싶으면 : 현재 점수\n" +
                        "점수를 초기화 하고 싶으면 :  점수 초기화";
                    rtm.sendMessage(info, channel.id)
                        .then((res) => {
                            console.log('Message sent: ', res.ts);
                        })
                        .catch(console.error);
                }

                if (message.text.slice(0, 5) === "점수 정산") {
                    users.forEach(a => {
                        getThisWeekSolved(a).then(function (tried) {
                            getTotalSolved(tried, a).then(function (resolve) {
                                scores[users.indexOf(a)] = resolve[a].length;
                            }).then(function () {
                                rtm.sendMessage(a + "의 점수는 " + scores[users.indexOf(a)] + " 입니다.", channel.id)
                                    .then((res) => {
                                        console.log('Message sent: ', res.ts);
                                    })
                                    .catch(console.error);
                            })
                        });
                    });
                }

                if (message.text.slice(0, 5) === "현재 점수") {
                    users.forEach(a => {
                        rtm.sendMessage(a + "의 점수는 " + scores[users.indexOf(a)] + " 입니다.", channel.id)
                            .then((res) => {
                                console.log('Message sent: ', res.ts);
                            })
                            .catch(console.error);
                    });
                }

                if (message.text === "점수 초기화") {
                    scores = [0, 0, 0, 0, 0, 0, 0, 0];
                    solved = {
                        'ctk0327': [],
                        'oyrin9595': [],
                        'ooiidd': [],
                        'klee': [],
                        'dragon4499': [],
                        'drcobi': [],
                        'fluxus': [],
                        'morot2': []
                    };
                    rtm.sendMessage("점수가 초기화 되었습니다.", channel.id)
                        .then((res) => {
                            console.log('Message sent: ', res.ts);
                        })
                        .catch(console.error);
                }

                if (message.text.slice(0, 6) === "이번주 문제") {
                    const prob = message.text.slice(7);
                    makeProblem(prob).then(function () {
                        rtm.sendMessage("이번주 해당 문제는 " + list.toString() + " 입니다.", channel.id)
                            .then((res) => {
                                console.log('Message sent: ', res.ts);
                            })
                            .catch(console.error);
                    });

                }
                if (message.text === "이번주 풀이") {
                    users.forEach(a => {
                        getThisWeekSolved(a).then(function (tried) {
                            let message;
                            if (tried.length !== 0) {
                                message = a + ' 의 이번주 풀이 문제는 ' + tried.toString() + ' 입니다.';
                            } else {
                                message = a + ' 의 이번주 풀이 문제는 없습니다 벌금내세요.'
                            }
                            rtm.sendMessage(message, channel.id)
                                .then((res) => {
                                    console.log('Message sent: ', res.ts);
                                })
                                .catch(console.error);
                        });
                    });
                }
                console.log(`(channel:${message.channel}) ${message.user} says: ${message.text}`);
            });
        } else {
            console.log('This bot does not belong to any channel, invite it to at least one and try again');
        }
    });

function getTotalSolved(tried, user) {
    return new Promise(function (resolve) {
        tried.forEach(a => {
            if (solved[user].indexOf(a) === -1) {
                solved[user].push(a);
            }
        });
        resolve(solved);
    });
}

const makeProblem = function (prob) {
    return new Promise(function (resolve, reject) {
        list = [];
        try {
            prob.split(",").forEach(a => {
                list.push(a)
            });
            resolve(list);
        } catch (e) {
            reject(list);
        }
    });
};

const getThisWeekSolved = function (user) {
    return new Promise(function (resolve, reject) {
        const url = 'https://www.acmicpc.net/user/';
        let tried = [];
        request(url + user).then(function (html) {
            const $ = cheerio.load(html);
            $('.panel-body .problem_number a').each(function () {
                const data = $(this);
                list.forEach((a) => {
                    if (a.toString() === data.text().toString()) {
                        tried.push(a);
                    }
                });
            });
        }).then(function () {
            console.log(tried);
            resolve(tried);
        }).catch(function () {
            reject([]);
        });
    });
};