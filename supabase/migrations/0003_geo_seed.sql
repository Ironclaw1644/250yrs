-- =============================================================================
-- 0003 — Geo seed: every country (ISO 3166-1), all 50 US states + DC, and
-- Jamaica's 14 parishes. Idempotent: conflicts skip (US/JM/KY already exist).
-- Cities are NOT seeded — they're created organically when businesses list
-- (find-or-create in /dashboard/new), which keeps hub pages content-gated.
-- =============================================================================

insert into taw.countries (code, name, slug, is_active) values
  ('AF','Afghanistan','af',true),('AL','Albania','al',true),('DZ','Algeria','dz',true),
  ('AD','Andorra','ad',true),('AO','Angola','ao',true),('AG','Antigua and Barbuda','ag',true),
  ('AR','Argentina','ar',true),('AM','Armenia','am',true),('AU','Australia','au',true),
  ('AT','Austria','at',true),('AZ','Azerbaijan','az',true),('BS','Bahamas','bs',true),
  ('BH','Bahrain','bh',true),('BD','Bangladesh','bd',true),('BB','Barbados','bb',true),
  ('BY','Belarus','by',true),('BE','Belgium','be',true),('BZ','Belize','bz',true),
  ('BJ','Benin','bj',true),('BT','Bhutan','bt',true),('BO','Bolivia','bo',true),
  ('BA','Bosnia and Herzegovina','ba',true),('BW','Botswana','bw',true),('BR','Brazil','br',true),
  ('BN','Brunei','bn',true),('BG','Bulgaria','bg',true),('BF','Burkina Faso','bf',true),
  ('BI','Burundi','bi',true),('CV','Cabo Verde','cv',true),('KH','Cambodia','kh',true),
  ('CM','Cameroon','cm',true),('CA','Canada','ca',true),('CF','Central African Republic','cf',true),
  ('TD','Chad','td',true),('CL','Chile','cl',true),('CN','China','cn',true),
  ('CO','Colombia','co',true),('KM','Comoros','km',true),('CG','Congo','cg',true),
  ('CD','Congo (DRC)','cd',true),('CR','Costa Rica','cr',true),('CI','Côte d''Ivoire','ci',true),
  ('HR','Croatia','hr',true),('CU','Cuba','cu',true),('CY','Cyprus','cy',true),
  ('CZ','Czechia','cz',true),('DK','Denmark','dk',true),('DJ','Djibouti','dj',true),
  ('DM','Dominica','dm',true),('DO','Dominican Republic','do',true),('EC','Ecuador','ec',true),
  ('EG','Egypt','eg',true),('SV','El Salvador','sv',true),('GQ','Equatorial Guinea','gq',true),
  ('ER','Eritrea','er',true),('EE','Estonia','ee',true),('SZ','Eswatini','sz',true),
  ('ET','Ethiopia','et',true),('FJ','Fiji','fj',true),('FI','Finland','fi',true),
  ('FR','France','fr',true),('GA','Gabon','ga',true),('GM','Gambia','gm',true),
  ('GE','Georgia','ge',true),('DE','Germany','de',true),('GH','Ghana','gh',true),
  ('GR','Greece','gr',true),('GD','Grenada','gd',true),('GT','Guatemala','gt',true),
  ('GN','Guinea','gn',true),('GW','Guinea-Bissau','gw',true),('GY','Guyana','gy',true),
  ('HT','Haiti','ht',true),('HN','Honduras','hn',true),('HU','Hungary','hu',true),
  ('IS','Iceland','is',true),('IN','India','in',true),('ID','Indonesia','id',true),
  ('IR','Iran','ir',true),('IQ','Iraq','iq',true),('IE','Ireland','ie',true),
  ('IL','Israel','il',true),('IT','Italy','it',true),('JP','Japan','jp',true),
  ('JO','Jordan','jo',true),('KZ','Kazakhstan','kz',true),('KE','Kenya','ke',true),
  ('KI','Kiribati','ki',true),('XK','Kosovo','xk',true),('KW','Kuwait','kw',true),
  ('KG','Kyrgyzstan','kg',true),('LA','Laos','la',true),('LV','Latvia','lv',true),
  ('LB','Lebanon','lb',true),('LS','Lesotho','ls',true),('LR','Liberia','lr',true),
  ('LY','Libya','ly',true),('LI','Liechtenstein','li',true),('LT','Lithuania','lt',true),
  ('LU','Luxembourg','lu',true),('MG','Madagascar','mg',true),('MW','Malawi','mw',true),
  ('MY','Malaysia','my',true),('MV','Maldives','mv',true),('ML','Mali','ml',true),
  ('MT','Malta','mt',true),('MH','Marshall Islands','mh',true),('MR','Mauritania','mr',true),
  ('MU','Mauritius','mu',true),('MX','Mexico','mx',true),('FM','Micronesia','fm',true),
  ('MD','Moldova','md',true),('MC','Monaco','mc',true),('MN','Mongolia','mn',true),
  ('ME','Montenegro','me',true),('MA','Morocco','ma',true),('MZ','Mozambique','mz',true),
  ('MM','Myanmar','mm',true),('NA','Namibia','na',true),('NR','Nauru','nr',true),
  ('NP','Nepal','np',true),('NL','Netherlands','nl',true),('NZ','New Zealand','nz',true),
  ('NI','Nicaragua','ni',true),('NE','Niger','ne',true),('NG','Nigeria','ng',true),
  ('KP','North Korea','kp',true),('MK','North Macedonia','mk',true),('NO','Norway','no',true),
  ('OM','Oman','om',true),('PK','Pakistan','pk',true),('PW','Palau','pw',true),
  ('PS','Palestine','ps',true),('PA','Panama','pa',true),('PG','Papua New Guinea','pg',true),
  ('PY','Paraguay','py',true),('PE','Peru','pe',true),('PH','Philippines','ph',true),
  ('PL','Poland','pl',true),('PT','Portugal','pt',true),('PR','Puerto Rico','pr',true),
  ('QA','Qatar','qa',true),('RO','Romania','ro',true),('RU','Russia','ru',true),
  ('RW','Rwanda','rw',true),('KN','Saint Kitts and Nevis','kn',true),('LC','Saint Lucia','lc',true),
  ('VC','Saint Vincent and the Grenadines','vc',true),('WS','Samoa','ws',true),
  ('SM','San Marino','sm',true),('ST','São Tomé and Príncipe','st',true),
  ('SA','Saudi Arabia','sa',true),('SN','Senegal','sn',true),('RS','Serbia','rs',true),
  ('SC','Seychelles','sc',true),('SL','Sierra Leone','sl',true),('SG','Singapore','sg',true),
  ('SK','Slovakia','sk',true),('SI','Slovenia','si',true),('SB','Solomon Islands','sb',true),
  ('SO','Somalia','so',true),('ZA','South Africa','za',true),('KR','South Korea','kr',true),
  ('SS','South Sudan','ss',true),('ES','Spain','es',true),('LK','Sri Lanka','lk',true),
  ('SD','Sudan','sd',true),('SR','Suriname','sr',true),('SE','Sweden','se',true),
  ('CH','Switzerland','ch',true),('SY','Syria','sy',true),('TW','Taiwan','tw',true),
  ('TJ','Tajikistan','tj',true),('TZ','Tanzania','tz',true),('TH','Thailand','th',true),
  ('TL','Timor-Leste','tl',true),('TG','Togo','tg',true),('TO','Tonga','to',true),
  ('TT','Trinidad and Tobago','tt',true),('TN','Tunisia','tn',true),('TR','Türkiye','tr',true),
  ('TM','Turkmenistan','tm',true),('TV','Tuvalu','tv',true),('UG','Uganda','ug',true),
  ('UA','Ukraine','ua',true),('AE','United Arab Emirates','ae',true),
  ('GB','United Kingdom','gb',true),('UY','Uruguay','uy',true),('UZ','Uzbekistan','uz',true),
  ('VU','Vanuatu','vu',true),('VA','Vatican City','va',true),('VE','Venezuela','ve',true),
  ('VN','Vietnam','vn',true),('YE','Yemen','ye',true),('ZM','Zambia','zm',true),
  ('ZW','Zimbabwe','zw',true)
on conflict (code) do nothing;

-- All 50 US states + DC (USPS codes, kebab slugs).
with us as (select id from taw.countries where code = 'US')
insert into taw.states (country_id, code, name, slug, is_active)
select us.id, v.code, v.name, v.slug, true from us, (values
  ('AL','Alabama','alabama'),('AK','Alaska','alaska'),('AZ','Arizona','arizona'),
  ('AR','Arkansas','arkansas'),('CA','California','california'),('CO','Colorado','colorado'),
  ('CT','Connecticut','connecticut'),('DE','Delaware','delaware'),('FL','Florida','florida'),
  ('GA','Georgia','georgia'),('HI','Hawaii','hawaii'),('ID','Idaho','idaho'),
  ('IL','Illinois','illinois'),('IN','Indiana','indiana'),('IA','Iowa','iowa'),
  ('KS','Kansas','kansas'),('KY','Kentucky','kentucky'),('LA','Louisiana','louisiana'),
  ('ME','Maine','maine'),('MD','Maryland','maryland'),('MA','Massachusetts','massachusetts'),
  ('MI','Michigan','michigan'),('MN','Minnesota','minnesota'),('MS','Mississippi','mississippi'),
  ('MO','Missouri','missouri'),('MT','Montana','montana'),('NE','Nebraska','nebraska'),
  ('NV','Nevada','nevada'),('NH','New Hampshire','new-hampshire'),('NJ','New Jersey','new-jersey'),
  ('NM','New Mexico','new-mexico'),('NY','New York','new-york'),
  ('NC','North Carolina','north-carolina'),('ND','North Dakota','north-dakota'),
  ('OH','Ohio','ohio'),('OK','Oklahoma','oklahoma'),('OR','Oregon','oregon'),
  ('PA','Pennsylvania','pennsylvania'),('RI','Rhode Island','rhode-island'),
  ('SC','South Carolina','south-carolina'),('SD','South Dakota','south-dakota'),
  ('TN','Tennessee','tennessee'),('TX','Texas','texas'),('UT','Utah','utah'),
  ('VT','Vermont','vermont'),('VA','Virginia','virginia'),('WA','Washington','washington'),
  ('WV','West Virginia','west-virginia'),('WI','Wisconsin','wisconsin'),
  ('WY','Wyoming','wyoming'),('DC','District of Columbia','district-of-columbia')
) as v(code, name, slug)
on conflict (country_id, slug) do nothing;

-- Jamaica's 14 parishes (the second live market).
with jm as (select id from taw.countries where code = 'JM')
insert into taw.states (country_id, code, name, slug, is_active)
select jm.id, null, v.name, v.slug, true from jm, (values
  ('Kingston','kingston'),('St. Andrew','st-andrew'),('St. Thomas','st-thomas'),
  ('Portland','portland'),('St. Mary','st-mary'),('St. Ann','st-ann'),
  ('Trelawny','trelawny'),('St. James','st-james'),('Hanover','hanover'),
  ('Westmoreland','westmoreland'),('St. Elizabeth','st-elizabeth'),
  ('Manchester','manchester'),('Clarendon','clarendon'),('St. Catherine','st-catherine')
) as v(name, slug)
on conflict (country_id, slug) do nothing;
