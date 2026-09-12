export const ANNOUNCEMENT_STORAGE_KEY = 'zbj_announcement_ack'

// id 变更即视为新公告，已确认过旧公告的用户会再次看到弹窗。
export const ANNOUNCEMENT = Object.freeze({
  id: '20260912-001',
  eyebrow: 'NOTICE TO ALL VISITORS · 第 001 号',
  title: '入馆须知',
  lead: '本馆常年陈列由用户投稿的“先进事迹”。进门之前，请先读完这张贴在门厅的告示。',
  clauses: Object.freeze([
    Object.freeze({
      order: '一',
      title: '不实名 · 不记名',
      body: '本站不核验投稿人身份，也不登记真实姓名。所有陈列内容均由用户自行上传，观点仅代表投稿人本人，不代表本馆立场；如与现实中的任何单位、人物或事件雷同，纯属巧合。',
    }),
    Object.freeze({
      order: '二',
      title: '简易施工 · 欢迎报修',
      body: '本站由业余时间搭建，装修从简、功能粗陋，难免有疏漏、错字和不顺手的地方。如果你有建议，或发现了哪里不对，请直接在站内留言——在任意一篇档案下方的“围观席发言”里说一句就行。',
    }),
  ]),
  footNote: '点击下方按钮即表示你已读过本须知，此后不再自动张贴。',
  confirmLabel: '已阅，进馆参观',
  dismissLabel: '稍后再看',
})
