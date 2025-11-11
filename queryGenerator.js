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
WHERE mm.merchant_id IN (${params.merchants_id.map(id => `'${id}'`).join(",")});

UPDATE core_merchant.sch_core.t_jer_business_hierarchy bh
SET name = '${params.business_name}', updated_date = NOW()
WHERE bh.jer_business_hierarchy_id = (
    SELECT mm.parent_node_id
    FROM core_merchant.sch_core.t_com_merchant_management mm
    WHERE mm.merchant_id = '${params.merchants_id[0]}'
);`;
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


UPDATE core_merchant.sch_core.t_jer_business_hierarchy bh
SET name = '${params.business_name}', updated_date = NOW()
WHERE bh.jer_business_hierarchy_id = (
    SELECT mm.parent_node_id
    FROM core_merchant.sch_core.t_com_merchant_management mm
    WHERE mm.merchant_id = '${params.merchants_id[0]}'
);`;
    }
}

module.exports = QueryGenerator;