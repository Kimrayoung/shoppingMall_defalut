const express = require('express');
const mysql = require('mysql');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const type = req.body.itemtype;
    cb(null, `./dataFile/dataImg/${type}`);
  },
});

const upload = multer({ storage: storage });

const conn = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '1234',
  database: 'shoppingMall',
  multipleStatements: true,
};

const connection = mysql.createConnection(conn);
connection.connect();

const router = express.Router();

//pagination //list middleware
router.use('/list',(req, res, next) => {
  const tag = 'middleware/item/list';
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
      const recordCountPerPage = Number(req.query.recordCountPerPage) || 10;  //한페이지에 보여지는 게시물의 갯수
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

router.get('/list', (req, res) => {
  const tag = 'get/item/list';
  console.log(tag);
  const pagination = req.pagination;  //pagination에서 구현한 미들웨어
  const type = req.query.type || 'all';

  const sql =
    type === 'all'
      ? `select * from item order by itemNumber desc limit ${pagination.firstRecordIndex}, ${pagination.recordCountPerPage};`
      : `select * from item where itemtype = '${type}' order by itemNumber desc limit ${pagination.firstRecordIndex}, ${pagination.recordCountPerPage};`;
  connection.query(sql, (err, result) => {
    if (err) {
      console.error(tag,err.message);
    }
    console.log(tag,'result',result);
    if (result) {
      res.render('item/list.html',{items: result, pagination: pagination, type: type});
    }
  });
});

function getPath(filepath) {
  const filepatharr = filepath.split('/');
  const realpath = filepatharr.slice(1, filepatharr.length - 1);
  return realpath.join('/');
}

router.get('/add',(req, res) => {
  const tag = 'get/item/add';
  console.log(tag);
  res.render('item/add.html');
})

router.post('/add', upload.single('uploadImg'), (req, res) => {
  const tag = 'post/item/add';
  console.log(tag);

  const body = req.body;
  const file = req.file;
  const imgOriginalName = file.originalname;
  const fileName = file.filename;
  const path = getPath(file.path);
  const itemtype = body.itemtype;
  const itemname = body.itemName;
  const value = body.value;
  const size = body.size;
  const color = body.color;

  const sql = `insert into shoppingMall.item (itemname, itemtype, value, size, colors, filename,originalFileName,imgFilePath) value ('${itemname}','${itemtype}',${value},'${size}','${color}','${fileName}','${imgOriginalName}','${path}');`;
  connection.query(sql, (err, result) => {
    if (err) {
      console.error(tag,err.message);
    }
    if (result) {
      console.log(tag,'result',result);
      res.redirect(`/item/list?type=${itemtype}`);
    }
  });
});

router.get('/modify', (req, res) => {
  const tag = 'get/item/modify';
  console.log(tag);

  const itemNumber = req.query.itemNumber;
  const currentPageNo = req.query.currentPageNo;
console.log('currentPageNo',currentPageNo);
  const sql = `select * from item where itemNumber = ${itemNumber}`;
  connection.query(sql, (err, result) => {
    if (err) {
      console.error(tag,err.message);
    } else {
      console.log(tag,'result',result);
      res.render('item/modify.html',{item: result[0], currentPageNo: currentPageNo})
    }
  });
});

router.post('/modify',upload.single('modifyimg'),(req, res, next) => {
    const tag = 'post/item/modify';
    console.log(tag);

    const currentPageNo = req.query.currentPageNo;
    console.log('currentPageNo',currentPageNo);
    const body = req.body;
    console.log('body',req.body);
    const file = req.file; 
    const itemNumber = Number(body.itemNumber); 
    const itemtype = body.itemtype;
    const itemname = body.itemName;
    const value = body.value;
    const size = body.size;
    const color = body.color;
    let sql = '';

    if(file === undefined) {
      sql = `update item set itemname = '${itemname}', itemtype = '${itemtype}', value ='${value}', size = '${size}', colors = '${color}'  where itemNumber = ${itemNumber};` 
    } else {
      const imgOriginalName = file.originalname;
      const fileName = file.filename;
      const path = getPath(file.path);
      sql = `update item set itemname = '${itemname}', itemtype = '${itemtype}', value ='${value}', size = '${size}', colors = '${color}', filename ='${fileName}', originalFileName = '${imgOriginalName}', imgFilePath ='${path}' where itemNumber = ${itemNumber};`;
    }

    connection.query(sql, (err, result, fields) => {
      if (err) {
        console.error('tag',err.message);
      } else {
        console.log(tag,'result',result);
        res.redirect(`/item/list?currentPageNo=${currentPageNo}&type=${itemtype}`);
      }
    });
  }
);

router.get('/delete', (req, res) => {
  const tag = 'get/item/delete';
  console.log(tag);

  const currentPageNo = req.query.currentPageNo;
  console.log('currentPageNo',currentPageNo);
  const itemNumber = req.query.itemNumber;
  const type = req.query.type;
  console.log('type',type);
  const sql = `delete from item where itemNumber=${itemNumber}` ;
  connection.query(sql, (err, result) => {
    if (err) {
      console.error(tag,err.message);
    } else {
      console.log(tag,'result',result);
      res.redirect(`/item/list?currentPageNo=${currentPageNo}&type=${type}`);
    }
  });
});

/* 
테스트용 더미 파일 생성 
sample url
http://localhost:8080/item/dummy?length=101&type=outer
http://localhost:8080/item/dummy?length=101&type=onepiece
http://localhost:8080/item/dummy?length=101&type=top
http://localhost:8080/item/dummy?length=301&type=knit
http://localhost:8080/item/dummy?length=401&type=bottom
http://localhost:8080/item/dummy?length=501&type=fitness
http://localhost:8080/item/dummy?length=601&type=homewear
http://localhost:8080/item/dummy?length=701&type=top
*/

router.get('/dummy', (req, res) => {
  const tag = 'get/item/dummy';
  console.log(tag);

  const data = Object.values({
    value: 20000,
    size: '77/88/99',
    colors: '#000000',
    filename: '8bf4259863bde63e3898dcd498672972',
    originalFileName: '0210000048803.gif',
    imgFilePath: 'dataImg/onepiece'
  });

  const datas = [];
  const length = req.query.length || 10;
  const type = req.query.type || 'onepiece';

    for (let i = 0; i < length; i++) {
        datas.push([`${type}${i + 1}`, type, ...data]);
    }

      const sql = `insert into shoppingMall.item (itemname, itemtype, value, size, colors, filename, originalFileName, imgFilePath) values ?`;

    connection.query(sql, [datas], (err, result) => {
        if (err) {
            console.error(tag, err.message);
        }
        if (result) {
            console.log(tag, 'result', result);
            res.redirect(`/item/list?type=${type}`);
        }
    });

})

module.exports = router;
