const express = require('express');
const mysql = require('mysql');

const conn = {
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '1234',
            database: 'shoppingMall'
}

const connection = mysql.createConnection(conn);
connection.connect();

const router = express.Router();

//비밀번호 유효성 검사
function validityPw(pw) {
            const specialString = '~!@#$%^&*(){[]';
            const number = '0123456789';
            const pwTxt = pw.value;
            let specialStringCnt = 0;
            let numberCnt = 0;

            //특수문자
            for(let i = 0 ; i < pwTxt.length; i++) {
                        if(specialString.includes(pwTxt[i])){
                                    specialStringCnt++;
                                    break;
                        }
            }
            //숫자
            for (let i = 0; i < pwTxt.length; i++) {
                        if(number.includes(pwTxt[i])) {
                                    numberCnt++;
                                    break;
                        }
            }

            console.log('cnt',specialStringCnt,numberCnt);
            if(specialStringCnt > 0 && numberCnt > 0) {
                        return true;
            }else return false;

}

//로그인
router.post('/login', (req, res) => {
    const tag = 'post/login' 
    console.log(tag)
    const body = req.body;
    const id = body.id;
    const pw  = body.pw;
    const sql = `select EXISTS(select id from shoppingMall.user where id = ${id} and pw = ${pw});`

    connection.query(sql,(err,result,fields) => {
        if(err) {
                    console.err(tag,err.message);
        }
        console.log(result);
        if(result) {
                    req.session.userId = id;
                    res.redirect('/');
        }
        else {
                    res.redirect('/login.html');
        }
    })
});

//회원가입
router.post('/signup',(req,res) => {
    const tag = 'post/signup' 
    console.log(tag)
    const body = req.body;
    const id = body.id;
    const pw = body.pw;
    const email = body.email;
    const year = body.year;
    const month = body.month;
    const day = body.day;
    const phone = body.phone;
    let overage = body.age;

    if(overage === 'on') {
                overage = true;
    } else {
                overage = false;
    }

    if(!validityPw(pw)) { 
                res.redirect('/signUp.html');
                return;
    }           

    const sql = `insert into shoppingMall.user(id, pw, email,phone, year, month, day, overage) values ('${id}','${pw}','${email}',${phone},${year},${month},${day},${overage});`
    console.log('sql',sql);
    connection.query(sql, (err,result, fields) => {
        if(err) {
                    console.err(tag,err.message);
        }
        if(result) {
                    res.redirect('/login.html');
        }
    })
});

//아이디 중복 검사
router.get('/duplicateid/:id',(req,res) => {
    const tag = 'get/duplicateid' 
    console.log(tag)
    const connection = mysql.createConnection(conn);
    connection.connect();
    const id = req.params.id; //req.params.id
    const sql = `select id from shoppingMall.user where id = '${id}';`;
    connection.query(sql,(err,result,fields) => {
        if(err) {
            console.err(tag,err.message);
        }
        if(result.length === 0) {
                    res.send('false');     
        } else if(result[0].id === id) {
                    res.send('true');
        } 

    })
});

//비밀번호 찾기
router.post('/findpw',(req,res) => {
    const tag = 'get/findpw' 
    console.log(tag)
    const body = req.body;
    const id = body.id;
    const year = Number(body.year);
    const month = Number(body.month);
    const day = Number(body.day);
    const email = body.email;
    const phone = body.phone;
    const sql = `select pw from shoppingMall.user where id = '${id}' and year=${year} and month=${month} and day=${day} and email ='${email}' and phone='${phone}';`;
    connection.query(sql,(err,result,fields) => {
                if(err) {
                    console.err(tag,err.message);
                }
                if(result.length === 0) {
                    res.json(false);
                }else{
                    res.json(result);
                }
    })
});

//아이디 찾기
router.post('/findid',(req,res) => {
            const connection = mysql.createConnection(conn);
            connection.connect();
            const body = req.body;
            const year = Number(body.year);
            const month = Number(body.month);
            const day = Number(body.day);
            const phone = body.phone;
            const sql = `select id from shoppingMall.user where year=${year} and month=${month} and day=${day} and phone='${phone}';`;
            connection.query(sql,(err,result,fields) => {
                        if(err) {
                            console.err(tag,err.message);
                        }
                        if(result.length === 0) {
                            res.json(false);
                        }else{
                            res.json(result);
                        }
            })
})


module.exports = router;