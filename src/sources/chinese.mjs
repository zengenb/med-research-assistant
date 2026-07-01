export function chineseSearchPortals({ query, includeGateway = false }) {
  const portals = [
    {
      name: "PubScholar公益学术平台",
      url: "https://pubscholar.stpaper.cn/",
      access: "public",
      purpose: "Chinese and international scholarly discovery with open resources",
    },
    {
      name: "NSTL国家科技图书文献中心",
      url: "https://www.nstl.gov.cn/",
      access: "public-registration",
      purpose: "Science and medical metadata plus document-delivery requests",
    },
    {
      name: "SinoMed中国生物医学文献服务系统",
      url: "https://www.sinomed.ac.cn/",
      access: "browser-or-institution",
      purpose: "Chinese biomedical subject searching",
    },
    {
      name: "万方数据",
      url: "https://g.wanfangdata.com.cn/",
      access: "subscription",
      purpose: "Chinese journals, theses, conferences, and medicine",
    },
    {
      name: "中国知网",
      url: "https://www.cnki.net/",
      access: "subscription",
      purpose: "Chinese journals, theses, conferences, and citations",
    },
  ];
  if (includeGateway) {
    portals.push({
      name: "User-authorized literature gateway",
      url: "http://www.wytsg.com/",
      access: "browser-only",
      purpose: "Fallback navigation to subscribed resources",
      warning: "HTTP login, CAPTCHA, dynamic sessions, and anti-sharing limits. Never store credentials or automate bulk downloads.",
    });
  }
  return {
    query,
    portals,
    instructions: [
      "Open the chosen portal in an authorized browser session.",
      "Paste the query and apply date, study-type, and subject filters.",
      "Export RIS, EndNote, BibTeX, or save records with Zotero when supported.",
      "Download only content covered by the user's access rights.",
      "Return exported records or local PDFs to the evidence workflow.",
    ],
  };
}
