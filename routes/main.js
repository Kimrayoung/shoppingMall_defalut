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

router.get('/index',(req, res, next) => {
    const tag = 'middleware/product/index';
    console.log(tag, 'body', req.body);
    const type = req.query.type || 'all';
    console.log('type',type);
    const sql = `select count(*) as totalRecoredCount from item ${type !== 'all' ? 'where itemtype= "'+type+'"' : ';'}`
    console.log('sql',sql);

    connection.query(sql, (err, result) => {
        if(err) {
            console.error(tag, err.message);
        }
        console.log(tag, 'result', result);
        if(result) {
            const currentPageNo = Number(req.query.currentPageNo) || 1; //현재 페이지 번호
            const recordCountPerPage = Number(req.query.recordCountPerPage) || 12;  //한페이지에 보여지는 게시물의 갯수
            const pageSize = 10; // 페이지 리스트 사이즈
            const totalRecoredCount = result[0].totalRecoredCount; //전체 아이템의 개수
            const totalPageCount = Math.floor((totalRecoredCount - 1) / recordCountPerPage) + 1; //총 페이지 갯수
            const firstPageNoOnPageList = Math.floor((currentPageNo -1) / pageSize) * pageSize + 1; //페이지 리스트의 첫번째 페이지 번호
            let lastPageNoOnPageList = (firstPageNoOnPageList + pageSize) - 1; //페이지 리스트의 마지막 페이지 번호
            if(lastPageNoOnPageList > totalPageCount) {
                lastPageNoOnPageList = totalPageCount;
            }

            const firstRecordIndex = (currentPageNo - 1) * recordCountPerPage; //db에서 찾을 데이터의 시작번호
            const lastRecordIndex = currentPageNo * recordCountPerPage;  //db에서 찾을 데이터의 마지막번호

            req.pagination = {
                currentPageNo,
                recordCountPerPage,
                pageSize,
                totalRecoredCount,
                totalPageCount,
                firstPageNoOnPageList,
                lastPageNoOnPageList,
                firstRecordIndex,
                lastRecordIndex
            }
            console.log(tag, 'pagination', req.pagination);
            next();
        }
    })
})

router.get('/index', (req,res) => {
    const tag = 'get/index'
    console.log(tag)
    const pagination = req.pagination
    const type = req.query.type || 'all'

    const sql =
        type === 'all'
        ? `select * from item order by itemNumber desc limit ${pagination.firstRecordIndex}, ${pagination.recordCountPerPage};`
        : `select * from item where itemtype = '${type}' order by itemNumber desc limit ${pagination.firstRecordIndex}, ${pagination.recordCountPerPage};`;
    
    connection.query(sql, (err, result) => {
        if(err) {
            console.error(tag, err.message)
        }
        console.log(tag, 'result',result)
        if (result) {
            res.render('main/index.html', {products : result, pagination : pagination, type: type});
        }
    });
})

module.exports = router;