const { document_type_code, document_type_id, person_type_id } = require('./constants');

class QueryGenerator {
    getQuery(params) {
        switch (params.strategy) {
            case 'E': return this.generateEQuery(params);
            case 'NE': return this.generateNEQuery(params);
        }
    }

    generateEQuery(params) {
        // Generate the 'E' query
        return `
WITH new_hierarchy_id AS (
    SELECT
	    parent_node_id
    FROM
	    core_merchant.sch_core.t_com_merchant_management
    WHERE
	    document_number = '${params.document_number}'
)
UPDATE core_merchant.sch_core.t_com_merchant_management bh
SET     
    parent_node_id = nh.parent_node_id,
    user_updated = 'tania.guizado@culqi.com',
    updated_date = NOW()
FROM new_hierarchy_id nh
WHERE bh.merchant_id IN (${params.merchants_id.map(id => `'${id}'`).join(",")});

WITH new_owner AS (
    SELECT
	    com_owner_id
    FROM
	    core_merchant.sch_core.t_com_owner
    WHERE
	    document_number = '${params.document_number}'
)

UPDATE core_merchant.sch_core.t_com_merchant_management mm
SET
    owner_id = no.com_owner_id,
    document_type_code = '${document_type_code[params.document_type]}',
    document_number = '${params.document_number}',
    user_updated = 'tania.guizado@culqi.com',
    updated_date = NOW()
FROM new_owner no
WHERE mm.merchant_id IN (${params.merchants_id.map(id => `'${id}'`).join(",")});`;
    }

    generateNEQuery(params) {
        // Generate the 'NE' query
        return `
WITH new_owner AS (
    INSERT INTO core_merchant.sch_core.t_com_owner (
        document_type,
        business_name,
        document_number,
        person_type,
        status_ind_type_code,
        status_ind_type,
        created_date,
        created_user,
        person_type_code,
        document_type_code
    )
    VALUES (
        ${document_type_id[params.document_type]},
        '${params.business_name}',
        '${params.document_number}',
        ${person_type_id[params.document_type]},
        '1',
        -1677,
        NOW(),
        'tania.guizado@culqi.com',
        '${document_type_code[params.document_type]}',
        '${params.document_type}'
    )
    RETURNING com_owner_id
)
UPDATE core_merchant.sch_core.t_com_merchant_management mm
SET
    owner_id = no.com_owner_id,
    document_type_code = '${document_type_code[params.document_type]}',
    document_number = '${params.document_number}',
    user_updated = 'tania.guizado@culqi.com',
    updated_date = NOW()
FROM new_owner no
WHERE mm.merchant_id IN (${params.merchants_id.map(id => `'${id}'`).join(",")});

WITH new_hierarchy_id AS (
    INSERT INTO core_merchant.sch_core.t_jer_business_hierarchy (
        name,
        level_type,
        level_type_code,
        node_type,
        node_type_code,
        share_token_indicator_type,
        share_token_indicator_type_code,
        daily_report_indicator_type,
        daily_report_indicator_type_code,
        card_number_masking_indicator_type,
        card_number_masking_indicator_type_code,
        compression_indicator_type,
        compression_indicator_type_code,
        debtor_balance_attachment_indicator_type,
        debtor_balance_attachment_indicator_type_code,
        payment_date_indicator_type,
        payment_date_indicator_type_code,
        transaction_date_time_visibility_indicator_type,
        transaction_date_time_visibility_indicator_type_code,
        use12_hour_format_type,
        use12_hour_format_type_code,
        created_date
    ) VALUES (
        '${params.business_name}',
        -1588,
        2,
        -1588,
        2,
        -1041,
        1,
        -1307,
        'Si',
        -1309,
        'Si',
        -1311,
        'Si',
        -1313,
        'Si',
        -1315,
        'Si',
        -1317,
        'Si',
        -1451,
        'Si',
        NOW()
    )
    RETURNING jer_business_hierarchy_id
)
UPDATE core_merchant.sch_core.t_com_merchant_management mm
SET
    parent_node_id = nh.jer_business_hierarchy_id,
    user_updated = 'tania.guizado@culqi.com',
    updated_date = NOW()
FROM new_hierarchy_id nh
WHERE mm.merchant_id IN (${params.merchants_id.map(id => `'${id}'`).join(",")});

WITH new_hierarchy_id AS (
    SELECT
        parent_node_id
    FROM core_merchant.sch_core.t_com_merchant_management 
    WHERE merchant_id IN (${params.merchants_id.map(id => `'${id}'`).join(",")})
    LIMIT 1
)
UPDATE core_merchant.sch_core.t_user_hierarchy
SET
    jer_business_hierarchy_id = nh.parent_node_id,
    updated_at = NOW()
FROM new_hierarchy_id nh
WHERE merchant_id IN (${params.merchants_id.map(id => `'${id}'`).join(",")});
`;
    }
}

module.exports = QueryGenerator;

161949